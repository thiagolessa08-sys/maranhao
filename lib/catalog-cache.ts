import type { Catalog, CatalogEntry } from './catalog-types'
export type { Catalog, CatalogEntry }

// Carrega catálogo estático ao inicializar o módulo
let cachedCatalog: Catalog | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cachedCatalog = require('./catalog.json') as Catalog
} catch { /* arquivo não existe ainda */ }

export function getCatalog(): Catalog | null {
  return cachedCatalog
}

export function setCatalog(c: Catalog) {
  cachedCatalog = c
}

export function isBuildInProgress(): boolean {
  return false
}

export function catalogToPromptContext(catalog: Catalog): string {
  const lines: string[] = [
    '══════════════════════════════════════════',
    'CATÁLOGO DE DADOS — DICIONÁRIO SEMÂNTICO',
    '══════════════════════════════════════════',
    '',
    '## Mapeamento de Conceitos → Tabelas',
    '(Use este mapa para identificar quais tabelas consultar para cada tipo de pergunta)',
    '',
  ]

  for (const [conceito, tabelas] of Object.entries(catalog.mapa_conceitos)) {
    lines.push(`• "${conceito}" → ${(tabelas as string[]).join(', ')}`)
  }

  lines.push('', '## Tabelas Principais com Colunas e JOINs')

  for (const entry of catalog.entradas) {
    lines.push(``, `### SEPLAN.${entry.tabela}`)
    lines.push(entry.descricao)
    if (Object.keys(entry.colunas_chave).length) {
      lines.push('Colunas principais:')
      for (const [col, desc] of Object.entries(entry.colunas_chave)) {
        lines.push(`  ${col}: ${desc}`)
      }
    }
    if (entry.joins_comuns.length) {
      lines.push(`JOINs: ${entry.joins_comuns.join(' | ')}`)
    }
    if (entry.exemplos_query?.length) {
      lines.push('Exemplo:')
      lines.push(entry.exemplos_query[0])
    }
  }

  return lines.join('\n')
}
