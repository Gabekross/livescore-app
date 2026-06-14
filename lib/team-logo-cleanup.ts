import sharp from 'sharp'

const MAX_DIMENSION = 1024
const MIN_WHITE_BORDER_RATIO = 0.45
const MIN_REMOVED_RATIO = 0.03
const MAX_REMOVED_RATIO = 0.92

export interface LogoCleanupResult {
  buffer: Buffer
  contentType: 'image/png'
  cleaned: boolean
}

function isNearWhite(r: number, g: number, b: number, alpha: number) {
  if (alpha < 20) return true

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return r >= 232 && g >= 232 && b >= 232 && max - min <= 24
}

function isBorderIndex(x: number, y: number, width: number, height: number) {
  return x === 0 || y === 0 || x === width - 1 || y === height - 1
}

function getPixelOffset(x: number, y: number, width: number) {
  return (y * width + x) * 4
}

function buildEdgeConnectedBackgroundMask(data: Buffer, width: number, height: number) {
  const pixelCount = width * height
  const visited = new Uint8Array(pixelCount)
  const mask = new Uint8Array(pixelCount)
  const queue: number[] = []

  let whiteBorderPixels = 0
  let borderPixels = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isBorderIndex(x, y, width, height)) continue

      borderPixels += 1
      const offset = getPixelOffset(x, y, width)
      const nearWhite = isNearWhite(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])
      if (!nearWhite) continue

      whiteBorderPixels += 1
      const idx = y * width + x
      if (!visited[idx]) {
        visited[idx] = 1
        queue.push(idx)
      }
    }
  }

  const borderRatio = borderPixels > 0 ? whiteBorderPixels / borderPixels : 0
  if (borderRatio < MIN_WHITE_BORDER_RATIO) {
    return { mask, removedPixels: 0, borderRatio }
  }

  let removedPixels = 0
  for (let i = 0; i < queue.length; i += 1) {
    const idx = queue[i]
    const x = idx % width
    const y = Math.floor(idx / width)
    const offset = idx * 4

    if (!isNearWhite(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) {
      continue
    }

    mask[idx] = 1
    removedPixels += 1

    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1,
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
    ]

    for (const next of neighbors) {
      if (next < 0 || visited[next]) continue
      const nextOffset = next * 4
      if (isNearWhite(data[nextOffset], data[nextOffset + 1], data[nextOffset + 2], data[nextOffset + 3])) {
        visited[next] = 1
        queue.push(next)
      }
    }
  }

  return { mask, removedPixels, borderRatio }
}

function applyTransparency(data: Buffer, mask: Uint8Array, width: number, height: number) {
  const output = Buffer.from(data)

  for (let idx = 0; idx < mask.length; idx += 1) {
    if (!mask[idx]) continue
    output[idx * 4 + 3] = 0
  }

  // Lightly soften the immediate edge so the logo does not get a jagged halo.
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x
      if (mask[idx]) continue

      const touchesBackground =
        mask[idx - 1] || mask[idx + 1] || mask[idx - width] || mask[idx + width]

      if (!touchesBackground) continue

      const offset = idx * 4
      if (isNearWhite(output[offset], output[offset + 1], output[offset + 2], output[offset + 3])) {
        output[offset + 3] = Math.min(output[offset + 3], 110)
      }
    }
  }

  return output
}

export async function cleanupTeamLogo(input: Buffer): Promise<LogoCleanupResult> {
  const base = sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha()

  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info

  const { mask, removedPixels } = buildEdgeConnectedBackgroundMask(data, width, height)
  const removedRatio = removedPixels / (width * height)

  if (removedRatio < MIN_REMOVED_RATIO || removedRatio > MAX_REMOVED_RATIO) {
    return {
      buffer: await base.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(),
      contentType: 'image/png',
      cleaned: false,
    }
  }

  const output = applyTransparency(data, mask, width, height)
  const buffer = await sharp(output, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()

  return { buffer, contentType: 'image/png', cleaned: true }
}
