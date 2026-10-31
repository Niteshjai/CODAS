import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MonthlyPoint {
  month: string
  total_paise: number
  bank_paise: number
  investments_paise: number
  land_paise: number
}

interface Props {
  data: MonthlyPoint[]
  change1m: number
  change6m: number
  change1y: number
  allTimeHigh: number
}

function formatINR(paise: number): string {
  const v = paise / 100
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)} K`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}

export default function NetWorthChart({
  data, change1m, change6m, change1y, allTimeHigh
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [period, setPeriod] = useState<'6m' | '12m' | '24m'>('12m')

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    const renderChart = () => {
      if (!svgRef.current) return
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const margin = { top: 16, right: 16, bottom: 36, left: 56 }
      const width = svgRef.current.clientWidth - margin.left - margin.right
      const height = 230 - margin.top - margin.bottom

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      const monthsToKeep = period === '6m' ? 6 : period === '12m' ? 12 : 24
      const filteredData = data.slice(-monthsToKeep)
      
      const points = filteredData.map(d => ({
        ...d,
        date: new Date(d.month)
      }))

      const x = d3.scaleTime()
        .domain(d3.extent(points, d => d.date) as [Date, Date])
        .range([0, width])

      const maxVal = (d3.max(points, d => Number(d.total_paise)) || 0)
      const y = d3.scaleLinear()
        .domain([0, maxVal * 1.15 || 100000])
        .range([height, 0])

      // Gridlines
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3.axisLeft(y)
            .ticks(4)
            .tickSize(-width)
            .tickFormat(() => '')
        )
        .selectAll('line')
        .style('stroke', 'rgba(161, 161, 170, 0.2)')
        .style('stroke-dasharray', '4,4')

      g.select('.grid .domain').remove()

      // Gradient definition
      const defs = svg.append('defs')
      const grad = defs.append('linearGradient')
        .attr('id', 'codas-nw-gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', 0).attr('y2', height + margin.top)

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#84cc16')
        .attr('stop-opacity', 0.28)
      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#84cc16')
        .attr('stop-opacity', 0.0)

      // Area fill
      const area = d3.area<any>()
        .x(d => x(d.date))
        .y0(height)
        .y1(d => y(Number(d.total_paise)))
        .curve(d3.curveMonotoneX)

      g.append('path')
        .datum(points)
        .attr('fill', 'url(#codas-nw-gradient)')
        .attr('d', area)

      // Line path
      const line = d3.line<any>()
        .x(d => x(d.date))
        .y(d => y(Number(d.total_paise)))
        .curve(d3.curveMonotoneX)

      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', '#65a30d')
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', line)

      // Dots
      const dots = g.selectAll('circle')
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(Number(d.total_paise)))
        .attr('r', 3.5)
        .attr('fill', '#84cc16')
        .style('stroke', 'var(--card)')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))')

      // X axis
      const xAxis = g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(
          d3.axisBottom(x)
            .ticks(width / 80)
            .tickFormat(d3.timeFormat('%b %y') as any)
            .tickSize(0)
        )
      
      xAxis.select('.domain').style('stroke', 'rgba(161, 161, 170, 0.25)')
      xAxis.selectAll('text')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', 'var(--muted-foreground)')
        .attr('dy', '1.2em')

      // Y axis
      const yAxis = g.append('g')
        .call(
          d3.axisLeft(y)
            .ticks(4)
            .tickFormat(d => formatINR(d as number))
            .tickSize(0)
        )
      
      yAxis.select('.domain').remove()
      yAxis.selectAll('text')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', 'var(--muted-foreground)')
        .attr('dx', '-0.5em')

      // Floating interactive Tooltip
      const tooltip = d3.select(svgRef.current!.parentNode as HTMLElement)
        .selectAll('.nw-tooltip')
        .data([1])
        .join('div')
        .attr('class', 'nw-tooltip absolute pointer-events-none opacity-0 bg-zinc-950/95 text-white px-3 py-2 rounded-xl text-xs font-medium shadow-2xl z-30 transition-all duration-150 border border-white/10 backdrop-blur-xl')
        .style('transform', 'translate(-50%, -100%)')
        .style('margin-top', '-12px')

      g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'transparent')
        .on('mousemove', (event) => {
          const [mx] = d3.pointer(event)
          const date = x.invert(mx)
          const bisect = d3.bisector((d: any) => d.date).left
          const i = bisect(points, date, 1)
          const d0 = points[i - 1]
          const d1 = points[i]
          const d = !d1 ? d0 : !d0 ? d1 : date.getTime() - d0.date.getTime() > d1.date.getTime() - date.getTime() ? d1 : d0

          if (!d) return

          tooltip
            .html(`
              <div class="text-[10px] text-zinc-400 font-medium tracking-wide uppercase mb-0.5">${d3.timeFormat('%B %Y')(d.date)}</div>
              <div class="text-[15px] font-bold text-lime-400 tracking-tight">${formatINR(d.total_paise)}</div>
            `)
            .style('left', `${x(d.date) + margin.left}px`)
            .style('top', `${y(d.total_paise) + margin.top}px`)
            .style('opacity', 1)

          dots
            .attr('r', (p: any) => p === d ? 6 : 3.5)
            .attr('fill', (p: any) => p === d ? '#bef264' : '#84cc16')
            .attr('stroke', (p: any) => p === d ? '#111827' : '#ffffff')
            .attr('stroke-width', (p: any) => p === d ? 2.5 : 2)
        })
        .on('mouseleave', () => {
          tooltip.style('opacity', 0)
          dots
            .attr('r', 3.5)
            .attr('fill', '#84cc16')
            .style('stroke', 'var(--card)')
            .attr('stroke-width', 2)
        })
    }

    renderChart()

    const resizeObserver = new ResizeObserver(() => {
      renderChart()
    })

    if (svgRef.current.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [data, period])

  // Use filtered data to show the latest point for the selected period
  const monthsToKeep = period === '6m' ? 6 : period === '12m' ? 12 : 24
  const filteredData = data.slice(-monthsToKeep)
  const latestPaiseRaw = filteredData.length ? filteredData[filteredData.length - 1]?.total_paise : 0
  const latestPaise = Number(latestPaiseRaw)
  const latestDisplayPaise = Number.isFinite(latestPaise) ? latestPaise : 0

  return (
    <div className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-zinc-300 dark:border-[#2E3148] h-full flex flex-col relative group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-lime-400 animate-pulse"></span>
            Net Worth Over Time
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-display text-zinc-900 dark:text-zinc-100 tracking-tight">
            {filteredData.length ? formatINR(latestDisplayPaise) : '—'}
          </div>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-white/5 p-1 rounded-full border border-zinc-200/80 dark:border-white/10 shadow-sm backdrop-blur-md">
          {(['6m', '12m', '24m'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 active:scale-95 ${
                period === p 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative flex-1 mt-2 min-h-[220px]">
        <svg ref={svgRef} className="w-full h-full absolute inset-0" style={{ overflow: 'visible' }} />
      </div>

      {/* Bottom KPI Stat Pills */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: '1 Month', value: change1m },
          { label: '6 Months', value: change6m },
          { label: '1 Year', value: change1y },
        ].map(item => {
          const isPositive = item.value > 0
          const isNegative = item.value < 0

          return (
            <div
              key={item.label}
              className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-md rounded-2xl py-3 px-3.5 text-center border border-white/90 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition hover:scale-[1.02]"
            >
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                {item.label}
              </div>
              <div className={`text-base sm:text-lg font-bold flex items-center justify-center gap-1 tracking-tight ${
                isPositive ? 'text-emerald-600 dark:text-lime-400' : isNegative ? 'text-rose-500' : 'text-zinc-500'
              }`}>
                {isPositive && <TrendingUp className="size-3.5 shrink-0 stroke-[2.5]" />}
                {isNegative && <TrendingDown className="size-3.5 shrink-0 stroke-[2.5]" />}
                <span>{isPositive ? '+' : ''}{item.value}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* All-time high badge */}
      {allTimeHigh > 0 && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white/40 dark:bg-white/5 px-3 py-1 rounded-full border border-zinc-200/60 dark:border-white/5">
            <span>All-time high:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formatINR(allTimeHigh)}</span>
          </span>
        </div>
      )}
    </div>
  )
}
