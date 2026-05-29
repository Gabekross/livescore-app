'use client'

// components/admin/RichTextEditor.tsx
// TipTap-based rich-text editor for post body content.
// Outputs HTML. Toolbar: headings, bold, italic, strike, link, image,
// video embed (YouTube / Vimeo / direct .mp4), blockquote, lists, hr, undo/redo.

import { useEditor, EditorContent } from '@tiptap/react'
import { Node, mergeAttributes }    from '@tiptap/core'
import StarterKit                   from '@tiptap/starter-kit'
import Link                         from '@tiptap/extension-link'
import Image                        from '@tiptap/extension-image'
import Placeholder                  from '@tiptap/extension-placeholder'
import { useCallback, useEffect, useState } from 'react'
import MediaPicker                  from '@/components/admin/MediaPicker'
import styles                       from '@/styles/components/RichTextEditor.module.scss'

interface Props {
  value:    string
  onChange: (html: string) => void
}

// ── Video embed helper ────────────────────────────────────────────────────────
function getEmbedInfo(raw: string): { src: string; isVideo: boolean } {
  const url = raw.trim()

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { src: `https://www.youtube.com/embed/${yt[1]}?rel=0`, isVideo: false }

  const vim = url.match(/vimeo\.com\/(\d+)/)
  if (vim) return { src: `https://player.vimeo.com/video/${vim[1]}`, isVideo: false }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { src: url, isVideo: true }

  return { src: url, isVideo: false }
}

// ── Custom VideoEmbed TipTap node ─────────────────────────────────────────────
// Outputs <div class="video-embed" data-video-embed><iframe|video .../></div>
// The .video-embed class in globals.css makes it 16:9 and responsive.
const VideoEmbed = Node.create({
  name:  'videoEmbed',
  group: 'block',
  atom:  true,

  addAttributes() {
    return {
      src:     { default: null },
      isVideo: { default: false },
    }
  },

  parseHTML() {
    return [{
      tag: 'div[data-video-embed]',
      getAttrs: (element) => {
        const el = element as HTMLElement
        const media = el.querySelector('video, iframe') as HTMLVideoElement | HTMLIFrameElement | null
        return {
          src: media?.getAttribute('src') || el.getAttribute('data-src') || null,
          isVideo: media?.tagName.toLowerCase() === 'video',
        }
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, isVideo } = HTMLAttributes
    const mediaAttrs = isVideo
      ? { src, controls: 'true',     style: 'position:absolute;top:0;left:0;width:100%;height:100%;border:0' }
      : { src, frameborder: '0', allowfullscreen: 'true',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          style: 'position:absolute;top:0;left:0;width:100%;height:100%;border:0' }
    const mediaTag = isVideo ? 'video' : 'iframe'
    return ['div', mergeAttributes({ 'data-video-embed': '', 'data-src': src, class: 'video-embed' }), [mediaTag, mediaAttrs]]
  },

  addCommands() {
    return {
      setVideoEmbed:
        (attrs: { src: string; isVideo: boolean }) =>
        ({ commands }: { commands: any }) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any
  },
})

// ── Component ─────────────────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange }: Props) {
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: 'Write the full article here...',
      }),
      VideoEmbed,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL', prev || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addVideo = useCallback(() => {
    if (!editor) return
    const url = window.prompt('YouTube, Vimeo, or direct video URL (.mp4 / .webm)')
    if (!url?.trim()) return
    const embed = getEmbedInfo(url)
    ;(editor.chain().focus() as any).setVideoEmbed(embed).run()
  }, [editor])

  const insertMedia = useCallback((url: string, mediaType?: 'image' | 'video') => {
    if (!editor) return
    if (mediaType === 'video') {
      ;(editor.chain().focus() as any).setVideoEmbed({ src: url, isVideo: true }).run()
      return
    }

    const embed = getEmbedInfo(url)
    if (embed.isVideo) {
      ;(editor.chain().focus() as any).setVideoEmbed(embed).run()
    } else {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className={styles.editorWrapper}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('bold') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('italic') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('strike') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('link') ? styles.active : ''}`}
            onClick={setLink}
            title="Link"
          >
            Link
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={addImage}
            title="Insert image by URL"
          >
            Img
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={addVideo}
            title="Embed YouTube / Vimeo / .mp4"
          >
            Vid
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => setShowMediaPicker(true)}
            title="Insert from media library"
          >
            Media
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          >
            UL
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered list"
          >
            OL
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            &ldquo;&rdquo;
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            ―
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            Undo
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            Redo
          </button>
        </div>
      </div>

      {/* ── Editor Content ── */}
      <EditorContent editor={editor} className={styles.editorContent} />

      <MediaPicker
        open={showMediaPicker}
        imagesOnly={false}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url, mediaType) => {
          insertMedia(url, mediaType)
          setShowMediaPicker(false)
        }}
      />
    </div>
  )
}
