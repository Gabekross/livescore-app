'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface StatRow {
  player_name: string
  goals:       number
  assists:     number
}

interface Props {
  data:      StatRow[]
  chartType: 'goals' | 'assists'
}

export default function StatsChart({ data, chartType }: Props) {
  const color = chartType === 'goals' ? '#2563eb' : '#16a34a'
  const rowCount = data.length
  const height = Math.max(140, rowCount * 36 + 24)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        barCategoryGap="28%"
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="player_name"
          type="category"
          width={120}
          tick={{ fontSize: 12, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey={chartType} fill={color} barSize={16} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={`cell-${i}`} fill={color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
