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
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis dataKey="player_name" type="category" width={120} />
        <Tooltip />
        <Bar dataKey={chartType} fill={color}>
          {data.map((_, i) => <Cell key={`cell-${i}`} fill={color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
