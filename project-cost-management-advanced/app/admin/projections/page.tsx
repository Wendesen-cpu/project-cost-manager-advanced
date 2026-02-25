'use client'

import { useState, useEffect } from 'react'

interface MonthProjection {
    month: string
    year: number
    monthIndex: number
    revenue: number
    cost: number
    margin: number
}

function formatEuro(amount: number): string {
    if (amount >= 1000) {
        return `€${amount.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    return `€${amount}`
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────
interface ChartProps {
    data: MonthProjection[]
}

function ProjectionsChart({ data }: ChartProps) {
    const CHART_W = 1100
    const CHART_H = 300
    const PADDING_LEFT = 70
    const PADDING_RIGHT = 20
    const PADDING_TOP = 20
    const PADDING_BOTTOM = 50

    const plotW = CHART_W - PADDING_LEFT - PADDING_RIGHT
    const plotH = CHART_H - PADDING_TOP - PADDING_BOTTOM

    const allValues = data.flatMap((d) => [d.revenue, d.cost, d.margin])
    const maxVal = Math.max(...allValues, 1)

    // Round up max to a nice number for y-axis labels
    const yMax = Math.ceil(maxVal / 8000) * 8000 || 32000
    const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].reverse()

    const n = data.length
    const groupW = plotW / n
    const barW = groupW * 0.25

    const xCenter = (i: number) => PADDING_LEFT + i * groupW + groupW / 2

    const yPos = (val: number) => PADDING_TOP + plotH - (val / yMax) * plotH

    // Margin line path
    const linePath = data
        .map((d, i) => {
            const x = xCenter(i)
            const y = yPos(Math.max(0, d.margin))
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                className="w-full"
                style={{ minWidth: 700, fontFamily: 'Arial, sans-serif' }}
            >
                {/* Y-axis gridlines & labels */}
                {yTicks.map((tick) => {
                    const y = yPos(tick)
                    return (
                        <g key={tick}>
                            <line
                                x1={PADDING_LEFT}
                                y1={y}
                                x2={CHART_W - PADDING_RIGHT}
                                y2={y}
                                stroke="#E2E8F0"
                                strokeWidth={1}
                            />
                            <text
                                x={PADDING_LEFT - 8}
                                y={y + 4}
                                textAnchor="end"
                                fontSize={11}
                                fill="#666"
                            >
                                {tick === 0 ? '0' : (tick / 1000).toFixed(0) + 'k'}
                            </text>
                        </g>
                    )
                })}

                {/* Bars (Revenue = blue, Cost = red) */}
                {data.map((d, i) => {
                    const cx = xCenter(i)
                    const revH = (d.revenue / yMax) * plotH
                    const costH = (d.cost / yMax) * plotH

                    return (
                        <g key={i}>
                            {/* Revenue bar */}
                            <rect
                                x={cx - barW - 1}
                                y={yPos(d.revenue)}
                                width={barW}
                                height={Math.max(0, revH)}
                                fill="#4F39F6"
                                rx={2}
                            />
                            {/* Cost bar */}
                            <rect
                                x={cx + 1}
                                y={yPos(d.cost)}
                                width={barW}
                                height={Math.max(0, costH)}
                                fill="#EF4444"
                                rx={2}
                            />
                            {/* X-axis label */}
                            <text
                                x={cx}
                                y={CHART_H - PADDING_BOTTOM + 18}
                                textAnchor="middle"
                                fontSize={11}
                                fill="#666"
                            >
                                {d.month}
                            </text>
                        </g>
                    )
                })}

                {/* Margin line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {/* Margin dots */}
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={xCenter(i)}
                        cy={yPos(Math.max(0, d.margin))}
                        r={4}
                        fill="#10B981"
                        stroke="white"
                        strokeWidth={1.5}
                    />
                ))}

                {/* X-axis baseline */}
                <line
                    x1={PADDING_LEFT}
                    y1={PADDING_TOP + plotH}
                    x2={CHART_W - PADDING_RIGHT}
                    y2={PADDING_TOP + plotH}
                    stroke="#E2E8F0"
                    strokeWidth={1}
                />
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 pb-1">
                <div className="flex items-center gap-1.5">
                    <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ backgroundColor: '#EF4444' }}
                    />
                    <span className="text-sm" style={{ color: '#EF4444', fontFamily: 'Arial, sans-serif' }}>
                        Cost
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ backgroundColor: '#10B981' }}
                    />
                    <span className="text-sm" style={{ color: '#10B981', fontFamily: 'Arial, sans-serif' }}>
                        Margin
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ backgroundColor: '#4F39F6' }}
                    />
                    <span className="text-sm" style={{ color: '#4F39F6', fontFamily: 'Arial, sans-serif' }}>
                        Revenue
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Table ────────────────────────────────────────────────────────────────────
interface TableProps {
    data: MonthProjection[]
}

function ProjectionsTable({ data }: TableProps) {
    const headers = ['Month', 'Revenue', 'Cost', 'Margin']

    return (
        <div
            className="w-full rounded-lg overflow-hidden"
            style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
        >
            <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ fontFamily: 'Arial, sans-serif' }}>
                    <thead>
                        <tr
                            style={{
                                backgroundColor: '#F8FAFC',
                                borderBottom: '1px solid #E2E8F0',
                            }}
                        >
                            {headers.map((h) => (
                                <th
                                    key={h}
                                    className="text-left px-6 py-3"
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 400,
                                        color: '#6A7282',
                                        letterSpacing: '0.6px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr
                                key={i}
                                style={{
                                    borderBottom:
                                        i < data.length - 1 ? '1px solid #E2E8F0' : 'none',
                                    backgroundColor: '#FFFFFF',
                                }}
                            >
                                {/* Month */}
                                <td
                                    className="px-6"
                                    style={{
                                        paddingTop: '16.25px',
                                        paddingBottom: '16.75px',
                                        fontSize: 14,
                                        color: '#0F172B',
                                        fontWeight: 400,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {row.month}
                                </td>
                                {/* Revenue */}
                                <td
                                    className="px-6"
                                    style={{
                                        paddingTop: '16.25px',
                                        paddingBottom: '16.75px',
                                        fontSize: 14,
                                        color: '#6A7282',
                                        fontWeight: 400,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatEuro(row.revenue)}
                                </td>
                                {/* Cost */}
                                <td
                                    className="px-6"
                                    style={{
                                        paddingTop: '16.25px',
                                        paddingBottom: '16.75px',
                                        fontSize: 14,
                                        color: '#6A7282',
                                        fontWeight: 400,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatEuro(row.cost)}
                                </td>
                                {/* Margin */}
                                <td
                                    className="px-6"
                                    style={{
                                        paddingTop: '16.25px',
                                        paddingBottom: '16.75px',
                                        fontSize: 14,
                                        color: row.margin >= 0 ? '#00A63E' : '#EF4444',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatEuro(row.margin)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectionsPage() {
    const [data, setData] = useState<MonthProjection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        fetch('/api/admin/projections')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load projections')
                return res.json()
            })
            .then((json: MonthProjection[]) => setData(json))
            .catch(() => setError('Could not load projections data.'))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="w-full min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">

                {/* Page heading */}
                <h1
                    className="font-bold"
                    style={{
                        fontSize: 24,
                        lineHeight: '32px',
                        color: '#171717',
                        fontFamily: 'Arial, sans-serif',
                    }}
                >
                    Financial Projections
                </h1>

                {/* Error */}
                {error && (
                    <div
                        className="rounded-xl border px-5 py-4 text-sm"
                        style={{
                            backgroundColor: '#FEF2F2',
                            borderColor: '#FECACA',
                            color: '#B91C1C',
                            fontFamily: 'Arial, sans-serif',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Chart card */}
                <div
                    className="w-full rounded-lg"
                    style={{
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                    }}
                >
                    <div className="px-4 pt-4 pb-2">
                        <p
                            className="font-bold"
                            style={{
                                fontSize: 18,
                                lineHeight: '28px',
                                color: '#171717',
                                fontFamily: 'Arial, sans-serif',
                            }}
                        >
                            Financial Projections (Next 12 Months)
                        </p>
                    </div>

                    <div className="px-4 pb-4">
                        {loading ? (
                            <div
                                className="flex items-center justify-center"
                                style={{ height: 300 }}
                            >
                                <div
                                    className="animate-spin rounded-full border-4 border-t-transparent"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderColor: '#4F39F6',
                                        borderTopColor: 'transparent',
                                    }}
                                />
                            </div>
                        ) : data.length > 0 ? (
                            <ProjectionsChart data={data} />
                        ) : (
                            <div
                                className="flex items-center justify-center"
                                style={{ height: 300, color: '#6A7282', fontFamily: 'Arial, sans-serif' }}
                            >
                                No projection data available.
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                {!loading && data.length > 0 && (
                    <ProjectionsTable data={data} />
                )}
            </div>
        </div>
    )
}
