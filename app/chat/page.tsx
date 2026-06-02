'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ReferenceLine,
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ToolEvent {
  name: string
  sql?: string
  rows?: number
  error?: string
  done: boolean
}

const SUGESTOES = [
  'Quais são as maiores despesas por secretaria?',
  'Mostre o total de despesas por mês em 2025',
  'Quais fornecedores receberam mais pagamentos?',
  'Compare empenho, liquidação e pagamento por secretaria',
]

// Paleta oficial da marca Governo do Maranhão
const CHART_COLORS = [
  '#163F8C', // azul
  '#009640', // verde
  '#E30613', // vermelho
  '#F18A00', // laranja
  '#FCD116', // amarelo
  '#00ADC6', // ciano/teal
  '#5CB85C', // verde-claro
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

.kc-root, .kc-root * { box-sizing: border-box; }
.kc-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--ink);
}

.kc-root[data-theme="light"] {
  --bg: oklch(0.97 0.008 95);
  --surface: #ffffff;
  --surface-2: oklch(0.96 0.01 240);
  --ink: oklch(0.18 0.02 240);
  --ink-2: oklch(0.42 0.02 240);
  --ink-3: oklch(0.62 0.015 240);
  --line: oklch(0.92 0.012 240);
  --line-2: oklch(0.88 0.015 240);
  --green: oklch(0.52 0.20 264);
  --green-deep: oklch(0.32 0.14 264);
  --green-ink: oklch(0.20 0.10 264);
  --green-soft: oklch(0.94 0.04 240);
  --amber: oklch(0.78 0.13 75);
  --rose: oklch(0.72 0.14 25);
  --radius: 22px;
  --radius-sm: 14px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --badge-bg: oklch(0.88 0.06 240);
  --msg-user-bg: var(--green);
  --msg-user-ink: #fff;
  --msg-ai-bg: var(--surface);
  --msg-ai-border: var(--line);
  --input-bg: var(--surface);
  --input-border: var(--line-2);
}
.kc-root[data-theme="dark"] {
  --bg: oklch(0.16 0.012 150);
  --surface: oklch(0.21 0.014 240);
  --surface-2: oklch(0.26 0.014 240);
  --ink: oklch(0.96 0.008 95);
  --ink-2: oklch(0.78 0.01 240);
  --ink-3: oklch(0.58 0.012 240);
  --line: oklch(0.28 0.014 240);
  --line-2: oklch(0.32 0.014 240);
  --green: oklch(0.64 0.18 264);
  --green-deep: oklch(0.26 0.10 264);
  --green-ink: oklch(0.20 0.10 264);
  --green-soft: oklch(0.28 0.06 240);
  --amber: oklch(0.78 0.13 75);
  --rose: oklch(0.72 0.14 25);
  --radius: 22px;
  --radius-sm: 14px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.35);
  --badge-bg: oklch(0.34 0.08 240);
  --msg-user-bg: var(--green);
  --msg-user-ink: oklch(0.14 0.02 150);
  --msg-ai-bg: var(--surface-2);
  --msg-ai-border: var(--line);
  --input-bg: var(--surface-2);
  --input-border: var(--line);
}

/* SIDEBAR */
.kc-sidebar {
  background: oklch(0.20 0.10 264);
  border-right: 1px solid oklch(0.26 0.12 264);
  padding: 24px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  height: 100vh;
  overflow: hidden;
}
.kc-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px 2px;
}
.kc-brand-icon {
  width: 38px; height: 38px;
  background: var(--green);
  border-radius: 12px;
  display: grid; place-items: center;
  flex-shrink: 0;
  color: #fff;
}
.kc-brand-text { line-height: 1.2; }
.kc-brand-text .t1 { font-size: 13.5px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.kc-brand-text .t2 { font-size: 10.5px; color: rgba(255,255,255,0.55); font-weight: 500; }

.kc-nav-label {
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.45);
  font-weight: 700;
  padding: 0 10px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.kc-nav { display: flex; flex-direction: column; gap: 2px; }
.kc-nav a, .kc-nav button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 10px;
  color: rgba(255,255,255,0.70);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  border: 0;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background .12s;
}
.kc-nav a:hover, .kc-nav button:hover { background: rgba(255,255,255,0.10); color: #fff; }
.kc-nav a.active { background: rgba(255,255,255,0.18); color: #fff; }
.kc-nav a svg, .kc-nav button svg { width: 16px; height: 16px; flex-shrink: 0; }

/* Suggestions */
.kc-sugg-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.kc-sugg-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}
.kc-sugg-list::-webkit-scrollbar { width: 4px; }
.kc-sugg-list::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 999px; }
.kc-sugg-btn {
  width: 100%;
  text-align: left;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 12.5px;
  font-family: inherit;
  color: var(--ink-2);
  cursor: pointer;
  line-height: 1.4;
  transition: background .12s, border-color .12s;
}
.kc-sugg-btn { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.70); }
.kc-sugg-btn:hover { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.25); color: #fff; }

/* Theme toggle */
.kc-theme-toggle {
  display: inline-flex;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}
.kc-theme-toggle button {
  width: 28px; height: 28px;
  border: 0; background: transparent;
  border-radius: 999px;
  cursor: pointer;
  display: grid; place-items: center;
  color: var(--ink-3);
  font-family: inherit;
  transition: background .12s;
}
.kc-theme-toggle button.on { background: var(--green); color: #fff; }
.kc-theme-toggle svg { width: 13px; height: 13px; }

/* MAIN */
.kc-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  min-width: 0;
}

/* Top bar */
.kc-topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}
.kc-title {
  font-family: 'Instrument Serif', serif;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--ink);
}
.kc-title em { font-style: italic; color: var(--green); }
.kc-topbar-right { display: flex; align-items: center; gap: 10px; }
.kc-schema-btn {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 5px 10px;
  cursor: pointer;
  font-family: inherit;
  transition: color .12s, border-color .12s;
}
.kc-schema-btn:hover { color: var(--green); border-color: var(--green); }
.kc-schema-btn:disabled { opacity: .4; cursor: not-allowed; }
.kc-cache-dot {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: oklch(0.55 0.20 264);
}
.kc-logout {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-3);
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: inherit;
  transition: color .12s;
}
.kc-logout:hover { color: var(--ink); }

/* Messages */
.kc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kc-messages::-webkit-scrollbar { width: 6px; }
.kc-messages::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 999px; }

/* Empty state */
.kc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: 40px 20px;
  gap: 0;
}
.kc-empty-icon {
  width: 64px; height: 64px;
  background: var(--green-soft);
  border-radius: 20px;
  display: grid; place-items: center;
  margin-bottom: 20px;
  color: var(--green);
}
.kc-empty h2 {
  font-family: 'Instrument Serif', serif;
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.kc-empty h2 em { font-style: italic; color: var(--green); }
.kc-empty p {
  font-size: 13.5px;
  color: var(--ink-3);
  margin: 0 0 28px;
  max-width: 360px;
  line-height: 1.6;
}
.kc-empty-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  max-width: 560px;
}

/* Message bubbles */
.kc-msg-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.kc-msg-row.user { flex-direction: row-reverse; }
.kc-avatar {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: grid; place-items: center;
  flex-shrink: 0;
  color: #fff;
}
.kc-avatar.ai { background: var(--green); }
.kc-avatar.user { background: var(--surface-2); color: var(--ink-2); }
.kc-bubble {
  max-width: 78%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 13.5px;
  line-height: 1.6;
}
.kc-bubble.user {
  background: var(--msg-user-bg);
  color: var(--msg-user-ink);
  border-radius: 18px 4px 18px 18px;
}
.kc-bubble.ai {
  background: var(--msg-ai-bg);
  border: 1px solid var(--msg-ai-border);
  border-radius: 4px 18px 18px 18px;
  color: var(--ink);
}

/* Tool indicator */
.kc-tool {
  margin-left: 44px;
  font-size: 12px;
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kc-tool.running {
  background: oklch(0.96 0.02 85);
  border: 1px solid oklch(0.9 0.04 85);
  color: oklch(0.48 0.12 75);
}
.kc-root[data-theme="dark"] .kc-tool.running {
  background: oklch(0.26 0.04 75);
  border-color: oklch(0.32 0.06 75);
  color: oklch(0.80 0.12 80);
}
.kc-tool.ok {
  background: oklch(0.96 0.02 240);
  border: 1px solid oklch(0.9 0.04 240);
  color: oklch(0.40 0.16 240);
}
.kc-root[data-theme="dark"] .kc-tool.ok {
  background: oklch(0.28 0.06 150);
  border-color: oklch(0.34 0.07 150);
  color: oklch(0.80 0.10 150);
}
.kc-tool.err {
  background: oklch(0.96 0.02 25);
  border: 1px solid oklch(0.90 0.04 25);
  color: oklch(0.42 0.12 25);
}
.kc-root[data-theme="dark"] .kc-tool.err {
  background: oklch(0.26 0.05 25);
  border-color: oklch(0.32 0.07 25);
  color: oklch(0.80 0.12 25);
}
.kc-tool-row { display: flex; align-items: center; gap: 8px; }
.kc-sql-toggle {
  margin-left: auto;
  background: transparent;
  border: 0;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  opacity: .8;
  transition: opacity .12s;
  color: inherit;
  text-decoration: underline;
  flex-shrink: 0;
}
.kc-sql-toggle:hover { opacity: 1; }
.kc-sql-pre {
  background: oklch(0.14 0.012 150);
  color: oklch(0.80 0.12 150);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
  line-height: 1.5;
}

/* Markdown overrides inside AI bubble */
.kc-bubble.ai p { margin: 0 0 4px; font-size: 13.5px; color: var(--ink); }
.kc-bubble.ai h1, .kc-bubble.ai h2, .kc-bubble.ai h3 { color: var(--ink); font-weight: 700; margin: 12px 0 4px; }
.kc-bubble.ai h1 { font-size: 16px; }
.kc-bubble.ai h2 { font-size: 15px; }
.kc-bubble.ai h3 { font-size: 14px; }
.kc-bubble.ai li { color: var(--ink-2); font-size: 13.5px; }
.kc-bubble.ai strong { color: var(--ink); font-weight: 700; }
.kc-bubble.ai code { background: var(--surface-2); color: var(--green); padding: 1px 5px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; font-size: 12px; }

/* Table inside bubble */
.kc-md-table { overflow-x: auto; border-radius: 14px; border: 1px solid var(--line); margin: 10px 0; box-shadow: var(--shadow-sm); }
.kc-md-table table { width: 100%; font-size: 12.5px; border-collapse: collapse; }
.kc-md-table thead tr { background: var(--green); }
.kc-md-table th { text-align: left; padding: 9px 14px; font-size: 11px; font-weight: 700; color: #fff; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; border: none; }
.kc-md-table tbody tr:nth-child(even) td { background: var(--surface-2); }
.kc-md-table tbody tr:nth-child(odd) td { background: var(--surface); }
.kc-md-table td { padding: 8px 14px; border-bottom: 1px solid var(--line); color: var(--ink-2); font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.kc-md-table tr:last-child td { border-bottom: 0; }
.kc-md-table tbody tr:hover td { background: var(--green-soft) !important; color: var(--ink); transition: background .1s; }
.kc-md-table td:first-child { color: var(--ink); font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; }
.kc-chart-toggle { display: flex; gap: 4px; margin-bottom: 10px; }
.kc-chart-tab {
  font-size: 12px; font-weight: 700; padding: 5px 14px;
  border-radius: 999px; border: 1px solid var(--line-2);
  background: var(--surface); color: var(--ink-2);
  cursor: pointer; font-family: inherit; transition: all .12s;
  display: flex; align-items: center; gap: 5px;
}
.kc-chart-tab:hover { border-color: var(--green); color: var(--green); }
.kc-chart-tab.on { background: var(--green); color: #fff; border-color: var(--green); box-shadow: 0 2px 8px oklch(0.48 0.11 155 / .25); }

/* Input area */
.kc-input-bar {
  background: var(--surface);
  border-top: 1px solid var(--line);
  padding: 16px 24px;
  flex-shrink: 0;
}
.kc-input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 860px;
  margin: 0 auto;
}
.kc-textarea {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 16px;
  padding: 12px 16px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 13.5px;
  color: var(--ink);
  resize: none;
  outline: none;
  max-height: 140px;
  line-height: 1.5;
  transition: border-color .15s;
}
.kc-textarea:focus { border-color: var(--green); }
.kc-textarea::placeholder { color: var(--ink-3); }
.kc-textarea:disabled { opacity: .5; }
.kc-send-btn {
  width: 44px; height: 44px;
  background: var(--green);
  color: #fff;
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  display: grid; place-items: center;
  flex-shrink: 0;
  transition: background .12s, transform .08s;
}
.kc-send-btn:hover { background: var(--green-ink); }
.kc-send-btn:active { transform: scale(.95); }
.kc-send-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }

/* Spinner */
@keyframes kc-spin { to { transform: rotate(360deg); } }
.kc-spin { animation: kc-spin .8s linear infinite; }

/* Loading indicator */
.kc-thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 18px 18px 18px 4px;
  background: var(--msg-ai-bg);
  border: 1px solid var(--msg-ai-border);
  font-size: 13px;
  color: var(--ink-3);
  width: fit-content;
}
`

function parseNum(raw: string): number | null {
  const cleaned = raw
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function isTimeSeries(labels: string[]): boolean {
  return labels.filter(l =>
    /^\d{4}$/.test(l) ||
    /^\d{4}[-/]\d{2}/.test(l) ||
    /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i.test(l) ||
    /^\d{2}\/\d{4}$/.test(l)
  ).length >= labels.length * 0.6
}

function formatTick(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return val.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

type ChartType = 'bar' | 'bar-h' | 'area'

const CHART_TYPE_OPTS: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'bar',
    label: 'Colunas',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15V9M12 15V5M16 15v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  {
    type: 'bar-h',
    label: 'Barras',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 4h16M5 4v16M9 8h8M9 12h12M9 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  {
    type: 'area',
    label: 'Linha',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 17l4-6 4 3 4-7 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

function TableAndChart({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [view, setView] = useState<'table' | 'chart'>('chart')

  const numericCols = headers.map((_, ci) => {
    const vals = rows.slice(0, 15).map(r => parseNum(r[ci] ?? ''))
    const nonNull = vals.filter(v => v !== null)
    return nonNull.length >= Math.min(2, rows.length)
  })

  const labelColIdx = numericCols.findIndex(n => !n)
  const actualLabelCol = labelColIdx === -1 ? 0 : labelColIdx
  const valueCols = headers.map((_, i) => i).filter(i => numericCols[i] && i !== actualLabelCol)

  const hasChart = valueCols.length > 0 && rows.length >= 2

  const labels = rows.map(r => r[actualLabelCol] ?? '')
  const timeSeries = isTimeSeries(labels)
  const longLabels = labels.some(l => l.length > 18)

  const defaultChartType: ChartType = timeSeries ? 'area' : longLabels ? 'bar-h' : 'bar'
  const [chartType, setChartType] = useState<ChartType>(defaultChartType)

  const chartData = rows.map(row => {
    const obj: Record<string, string | number> = { label: row[actualLabelCol] ?? '' }
    valueCols.forEach(ci => {
      const val = parseNum(row[ci] ?? '')
      if (val !== null) obj[headers[ci]] = val
    })
    return obj
  })

  const maxLabelLen = Math.max(...labels.map(l => l.length))
  const yAxisWidth = Math.min(180, Math.max(80, maxLabelLen * 6.5))
  const chartHeight = chartType === 'bar-h'
    ? Math.max(200, Math.min(600, rows.length * 32 + 60))
    : Math.max(240, Math.min(400, rows.length * 20 + 80))

  const tableEl = (
    <div className="kc-md-table">
      <table>
        <thead>
          <tr>{headers.map((h, j) => <th key={j}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const tooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,.12)',
    padding: '10px 14px',
    fontSize: '12.5px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }

  const axisProps = {
    tick: { fontSize: 11, fill: 'var(--ink-3)', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    axisLine: false as const,
    tickLine: false as const,
  }

  const chartEl = (
    <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '16px 8px 8px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {valueCols.map((ci, idx) => (
                <linearGradient key={ci} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="label" {...axisProps} dy={8} />
            <YAxis tickFormatter={formatTick} {...axisProps} width={68} />
            <ReferenceLine y={0} stroke="var(--line-2)" strokeWidth={1} />
            <Tooltip formatter={(v) => [formatTick(Number(v ?? 0)), '']} contentStyle={tooltipStyle} cursor={{ stroke: 'var(--green)', strokeWidth: 1, strokeDasharray: '4 2' }} />
            <Legend wrapperStyle={{ fontSize: 11.5, paddingTop: 8 }} />
            {valueCols.map((ci, idx) => (
              <Area key={ci} type="monotone" dataKey={headers[ci]}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={2.5}
                fill={`url(#grad-${idx})`}
                dot={{ r: rows.length <= 24 ? 3 : 0, fill: CHART_COLORS[idx % CHART_COLORS.length], strokeWidth: 0 }}
                activeDot={{ r: 5, fill: CHART_COLORS[idx % CHART_COLORS.length], stroke: 'var(--surface)', strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        ) : chartType === 'bar-h' ? (
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
            <XAxis type="number" tickFormatter={formatTick} {...axisProps} />
            <YAxis dataKey="label" type="category" {...axisProps} width={yAxisWidth} />
            <ReferenceLine x={0} stroke="var(--line-2)" />
            <Tooltip formatter={(v) => [formatTick(Number(v ?? 0)), '']} contentStyle={tooltipStyle} cursor={{ fill: 'var(--green-soft)' }} />
            <Legend wrapperStyle={{ fontSize: 11.5, paddingTop: 8 }} />
            {valueCols.map((ci, idx) => (
              <Bar key={ci} dataKey={headers[ci]} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[0, 8, 8, 0]} maxBarSize={28} />
            ))}
          </BarChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: rows.length > 6 ? 48 : 30 }}>
            <XAxis dataKey="label" {...axisProps} angle={rows.length > 6 ? -35 : 0} textAnchor={rows.length > 6 ? 'end' : 'middle'} interval={0} dy={8} />
            <YAxis tickFormatter={formatTick} {...axisProps} width={68} />
            <ReferenceLine y={0} stroke="var(--line-2)" />
            <Tooltip formatter={(v) => [formatTick(Number(v ?? 0)), '']} contentStyle={tooltipStyle} cursor={{ fill: 'var(--green-soft)' }} />
            <Legend wrapperStyle={{ fontSize: 11.5, paddingTop: 8 }} />
            {valueCols.map((ci, idx) => (
              <Bar key={ci} dataKey={headers[ci]} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[6, 6, 0, 0]} maxBarSize={48} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )

  return (
    <div style={{ margin: '10px 0' }}>
      {hasChart && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div className="kc-chart-toggle">
            <button className={`kc-chart-tab${view === 'chart' ? ' on' : ''}`} onClick={() => setView('chart')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15V9M12 15V6M16 15v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Gráfico
            </button>
            <button className={`kc-chart-tab${view === 'table' ? ' on' : ''}`} onClick={() => setView('table')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 10h18M3 14h18M10 6v12M14 6v12" stroke="currentColor" strokeWidth="2"/></svg>
              Tabela
            </button>
          </div>

          {/* Chart type selector — only when chart is visible */}
          {view === 'chart' && (
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', borderRadius: '10px', padding: '3px' }}>
              {CHART_TYPE_OPTS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => setChartType(opt.type)}
                  title={opt.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', borderRadius: '7px', border: 'none',
                    background: chartType === opt.type ? 'var(--green)' : 'transparent',
                    color: chartType === opt.type ? '#fff' : 'var(--ink-3)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: '11.5px', fontWeight: 600,
                    transition: 'all .12s',
                    boxShadow: chartType === opt.type ? '0 2px 6px oklch(0.52 0.20 264 / .3)' : 'none',
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {view === 'chart' && hasChart ? chartEl : tableEl}
    </div>
  )
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i}>{part.slice(1, -1)}</code>
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={i} style={{ margin: '10px 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line)' }}>
          {lang && (
            <div style={{ background: 'oklch(0.18 0.012 150)', color: 'var(--ink-3)', fontSize: '11px', padding: '6px 12px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>
              {lang}
            </div>
          )}
          <pre style={{ background: 'oklch(0.14 0.012 150)', color: 'oklch(0.80 0.12 150)', fontSize: '12px', padding: '12px', margin: 0, overflowX: 'auto', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6, whiteSpace: 'pre' }}>
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++
      continue
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const rows = tableLines
        .filter(l => !l.match(/^\|[\s\-:|]+\|$/))
        .map(l =>
          l.split('|')
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map(c => c.trim())
        )
      if (rows.length > 0) {
        const [headerRow, ...dataRows] = rows
        elements.push(<TableAndChart key={i} headers={headerRow} rows={dataRows} />)
      }
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i}>{line.slice(2)}</h1>)
    } else if (line.match(/^[-*] /)) {
      elements.push(<li key={i} style={{ marginLeft: '16px', listStyle: 'disc' }}><InlineMarkdown text={line.slice(2)} /></li>)
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '6px' }} />)
    } else {
      elements.push(<p key={i}><InlineMarkdown text={line} /></p>)
    }
    i++
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{elements}</div>
}

function ToolIndicator({ tool }: { tool: ToolEvent }) {
  const [showSql, setShowSql] = useState(false)

  if (tool.done && tool.error) {
    return (
      <div className="kc-tool err">
        <div className="kc-tool-row">
          <span>✗ Query falhou:</span>
          <span style={{ opacity: .8 }}>{tool.error}</span>
          {tool.sql && (
            <button className="kc-sql-toggle" onClick={() => setShowSql(v => !v)}>
              {showSql ? 'Ocultar query' : 'Ver query'}
            </button>
          )}
        </div>
        {showSql && tool.sql && <pre className="kc-sql-pre">{tool.sql}</pre>}
      </div>
    )
  }

  if (tool.done) {
    return (
      <div className="kc-tool ok">
        <div className="kc-tool-row">
          <span>✓</span>
          <span>{tool.rows} linha{tool.rows !== 1 ? 's' : ''} retornada{tool.rows !== 1 ? 's' : ''}</span>
          {tool.sql && (
            <button className="kc-sql-toggle" onClick={() => setShowSql(v => !v)}>
              {showSql ? 'Ocultar query' : 'Ver query'}
            </button>
          )}
        </div>
        {showSql && tool.sql && <pre className="kc-sql-pre">{tool.sql}</pre>}
      </div>
    )
  }

  return (
    <div className="kc-tool running">
      <div className="kc-tool-row">
        <svg className="kc-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Consultando Sybase IQ…</span>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [messages, setMessages] = useState<Message[]>([])
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [schemaLoaded, setSchemaLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('k-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, toolEvents, loading])

  function toggleTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('k-theme', t)
  }

  async function send(text?: string, forceRefreshSchema = false) {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    const userMsg: Message = { role: 'user', content: userText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setToolEvents([])

    let assistantContent = ''
    const currentTools: ToolEvent[] = []
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          forceRefreshSchema,
        }),
      })

      if (res.status === 401) { router.push('/login'); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          const event = JSON.parse(raw)

          if (event.type === 'text') {
            assistantContent += event.text
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
              return updated
            })
          } else if (event.type === 'tool_start') {
            const tool: ToolEvent = { name: event.name, sql: event.sql, done: false }
            currentTools.push(tool)
            setToolEvents([...currentTools])
            setSchemaLoaded(true)
          } else if (event.type === 'tool_end') {
            const last = currentTools[currentTools.length - 1]
            if (last) {
              last.done = true
              last.rows = event.rows
              last.error = event.error
            }
            setToolEvents([...currentTools])
          } else if (event.type === 'error') {
            assistantContent += '\n' + event.text
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
              return updated
            })
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }
        return updated
      })
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const thinkingLabel = toolEvents.some(t => !t.done)
    ? 'Consultando o banco de dados…'
    : toolEvents.length > 0
    ? 'Elaborando resposta…'
    : 'Analisando sua pergunta…'

  return (
    <div className="kc-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── SIDEBAR ── */}
      <aside className="kc-sidebar">

        {/* Brand */}
        <div className="kc-brand">
          <img src="/logo-maranhao.png" alt="Governo do Maranhão" style={{ width: '100%', height: 'auto', background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'block' }} />
        </div>

        {/* Navigation */}
        <div>
          <div className="kc-nav-label">Menu</div>
          <nav className="kc-nav">
            <Link href="/orcamento">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15V9M12 15V5M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Orçamento
            </Link>
            <Link href="/receita">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Receita
            </Link>
            <Link href="/despesa">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 3v18M16 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Despesa
            </Link>
            <Link href="/iptu">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              IPTU
            </Link>
            <a className="active" href="/chat">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Chat IA
            </a>
            <Link href="/catalogo">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Catálogo
            </Link>
            <Link href="/dashboard">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 13l9-9 9 9M5 11v9h14v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Consulta
            </Link>
          </nav>
        </div>

        {/* Suggestions */}
        <div className="kc-sugg-section">
          <div className="kc-nav-label">Sugestões</div>
          <div className="kc-sugg-list">
            {SUGESTOES.map(s => (
              <button key={s} className="kc-sugg-btn" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom promo */}
        <div style={{
          background: 'var(--green-ink)',
          borderRadius: '16px',
          padding: '16px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(70% 60% at 0% 100%, oklch(0.42 0.11 155 / 0.85), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            {schemaLoaded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '999px', background: 'oklch(0.70 0.18 145)', display: 'inline-block' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'oklch(0.88 0.08 150)' }}>Schema em cache</span>
              </div>
            )}
            <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'oklch(0.88 0.02 150)', lineHeight: 1.4 }}>
              Haiku 4.5 · Sybase IQ
            </p>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }}
              style={{
                background: '#fff', color: 'var(--green-ink)',
                border: 0, borderRadius: '999px', padding: '7px 16px',
                fontWeight: 700, fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="kc-main">

        {/* Topbar */}
        <div className="kc-topbar">
          <h1 className="kc-title">Chat <em>IA</em></h1>
          <div className="kc-topbar-right">
            {schemaLoaded && (
              <div className="kc-cache-dot">
                <span style={{ width: 7, height: 7, borderRadius: '999px', background: 'oklch(0.55 0.20 264)', display: 'inline-block' }} />
                Schema em cache
              </div>
            )}
            <button
              className="kc-schema-btn"
              onClick={() => send(undefined, true)}
              disabled={loading}
              title="Recarregar schema do banco"
            >
              ↺ Schema
            </button>
            <div className="kc-theme-toggle" role="group" aria-label="Tema">
              <button className={theme === 'light' ? 'on' : ''} onClick={() => toggleTheme('light')} aria-label="Claro">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
              <button className={theme === 'dark' ? 'on' : ''} onClick={() => toggleTheme('dark')} aria-label="Escuro">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="kc-messages">
          {messages.length === 0 ? (
            <div className="kc-empty">
              <div className="kc-empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Olá! O que deseja <em>saber?</em></h2>
              <p>Faça perguntas sobre os dados municipais em português. Vou consultar o banco Sybase IQ e responder com dados reais.</p>
              <div className="kc-empty-grid">
                {SUGESTOES.map(s => (
                  <button key={s} className="kc-sugg-btn" style={{ textAlign: 'left' }} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isLast = i === messages.length - 1
                const isAssistant = msg.role === 'assistant'
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className={`kc-msg-row${msg.role === 'user' ? ' user' : ''}`}>
                      <div className={`kc-avatar ${isAssistant ? 'ai' : 'user'}`}>
                        {isAssistant ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className={`kc-bubble ${isAssistant ? 'ai' : 'user'}`}>
                        {msg.role === 'user' ? (
                          <span>{msg.content}</span>
                        ) : msg.content ? (
                          <MarkdownText text={msg.content} />
                        ) : (
                          <div className="kc-thinking">
                            <svg className="kc-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {thinkingLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {isLast && isAssistant && toolEvents.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '44px' }}>
                        {toolEvents.map((t, ti) => <ToolIndicator key={ti} tool={t} />)}
                      </div>
                    )}
                  </div>
                )
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '44px' }}>
                  <div className="kc-thinking">
                    <svg className="kc-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {thinkingLabel}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="kc-input-bar">
          <div className="kc-input-row">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              placeholder="Pergunte sobre os dados municipais… (Enter para enviar)"
              className="kc-textarea"
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 140) + 'px'
              }}
            />
            <button
              className="kc-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
