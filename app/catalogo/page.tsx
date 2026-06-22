'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Catalog, CatalogEntry } from '@/lib/catalog-types'

export default function CatalogoPage() {
  const router = useRouter()
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [building, setBuilding] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null)

  useEffect(() => { loadCatalog() }, [])

  async function loadCatalog() {
    try {
      const res = await fetch('/api/catalog')
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      if (data.catalog) setCatalog(data.catalog)
    } catch { /* silently fail */ }
  }

  async function startBuild() {
    setBuilding(true)
    setLog(['Verificando catálogo...'])
    try {
      const res = await fetch('/api/catalog/gerar', { method: 'POST' })
      const body = await res.text()
      let data: Record<string, unknown> = {}
      try { data = JSON.parse(body) } catch { /* ignore */ }

      if (!res.ok) {
        setLog([`❌ ${data.error ?? `HTTP ${res.status}`}`])
        return
      }
      setLog([`✅ Catálogo carregado com ${data.tabelas} tabelas!`])
      await loadCatalog()
    } catch (e) {
      setLog([`❌ ${String(e)}`])
    } finally {
      setBuilding(false)
    }
  }

  const filtered = catalog?.entradas.filter(e =>
    !search ||
    e.tabela.toLowerCase().includes(search.toLowerCase()) ||
    e.descricao.toLowerCase().includes(search.toLowerCase()) ||
    e.conceitos.some(c => c.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div>
            <h1 className="text-base font-bold leading-none">Catálogo de Dados</h1>
            <p className="text-blue-300 text-xs">Dicionário semântico — pref_aruja_sp</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-blue-300 hover:text-white text-sm transition-colors">Chat IA</Link>
          <Link href="/dashboard" className="text-blue-300 hover:text-white text-sm transition-colors">← Dashboard</Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — tabelas */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
          {/* Build button */}
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={startBuild}
              disabled={building}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {building ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Gerando catálogo…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {catalog ? 'Regenerar Catálogo' : 'Gerar Catálogo com IA'}
                </>
              )}
            </button>

            {catalog && (
              <p className="text-xs text-slate-400 text-center mt-2">
                {catalog.entradas.length} tabelas •{' '}
                {new Date(catalog.gerado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            )}

            {/* Log de build */}
            {log.length > 0 && (
              <div className="mt-3 bg-slate-900 rounded-lg p-2 max-h-28 overflow-y-auto">
                {log.map((l, i) => (
                  <p key={i} className="text-xs font-mono text-green-300">{l}</p>
                ))}
              </div>
            )}
          </div>

          {/* Busca */}
          {catalog && (
            <div className="px-3 py-2 border-b border-slate-100">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar tabela ou conceito…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              />
            </div>
          )}

          {/* Lista de tabelas */}
          <div className="flex-1 overflow-y-auto py-1">
            {!catalog && !building && (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                <p>Nenhum catálogo gerado.</p>
                <p className="text-xs mt-1">Clique em "Gerar Catálogo" para começar.</p>
              </div>
            )}
            {filtered.map(entry => (
              <button
                key={entry.tabela}
                onClick={() => setSelectedEntry(entry)}
                className={`w-full text-left px-4 py-2.5 border-b border-slate-50 hover:bg-blue-50 transition-colors ${
                  selectedEntry?.tabela === entry.tabela ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                }`}
              >
                <p className="text-xs font-mono font-medium text-slate-700 truncate">{entry.tabela}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{entry.descricao}</p>
                {entry.conceitos.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.conceitos.slice(0, 3).map(c => (
                      <span key={c} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main — detalhe */}
        <main className="flex-1 overflow-auto p-6">
          {/* Mapa de conceitos */}
          {catalog && !selectedEntry && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Mapa de Conceitos de Negócio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {Object.entries(catalog.mapa_conceitos).map(([conceito, tabelas]) => (
                  <div key={conceito} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="font-semibold text-slate-800 capitalize mb-2">{conceito}</p>
                    <div className="space-y-1">
                      {tabelas.map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedEntry(catalog.entradas.find(e => e.tabela === t) ?? null)}
                          className="block text-xs font-mono text-blue-700 hover:underline text-left"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm">Selecione uma tabela na barra lateral para ver detalhes.</p>
            </div>
          )}

          {/* Detalhe de uma tabela */}
          {selectedEntry && (
            <div className="max-w-2xl">
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
              >
                ← Voltar ao mapa
              </button>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-800 px-5 py-4">
                  <p className="text-xs text-slate-400 font-mono">pref_aruja_sp</p>
                  <h2 className="text-white font-bold font-mono text-lg">{selectedEntry.tabela}</h2>
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descrição</p>
                    <p className="text-slate-700">{selectedEntry.descricao}</p>
                  </div>

                  {selectedEntry.conceitos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Responde perguntas sobre
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.conceitos.map(c => (
                          <span key={c} className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(selectedEntry.colunas_chave).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Colunas Principais
                      </p>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Coluna</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Significado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(selectedEntry.colunas_chave).map(([col, desc]) => (
                            <tr key={col} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono text-blue-700 text-xs">{col}</td>
                              <td className="px-3 py-2 text-slate-600">{desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedEntry.joins_comuns.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        JOINs Comuns
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.joins_comuns.map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedEntry(catalog!.entradas.find(e => e.tabela === t) ?? null)}
                            className="font-mono text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Query de exemplo */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Query de Exemplo
                    </p>
                    <pre className="bg-slate-900 text-green-300 text-xs p-4 rounded-lg overflow-x-auto font-mono">
{`SELECT TOP 10 *
FROM pref_aruja_sp.${selectedEntry.tabela}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!catalog && !building && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <svg className="w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-slate-500 font-medium mb-1">Catálogo não gerado</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Clique em "Gerar Catálogo com IA" para analisar o banco e criar o dicionário semântico automaticamente.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
