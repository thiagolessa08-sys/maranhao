import { agentSchema } from './agent'

interface TableSchema {
  name: string
  columns: { name: string; type: string; nullable: boolean }[]
}

// Tabelas do catálogo do DW estadual (Sybase IQ DWPROD16) — sem prefixo de schema.
// Apenas estas são carregadas no contexto para manter o prompt enxuto.
export const CATALOG_TABLE_NAMES = [
  'FATO_INTERVENCAO_DOTACAO',
  'FATO_EXECUCAO_RECEITA',
  'FATO_REPASSE_FINANCEIRO',
  'DIM_DATA_CALENDARIO',
  'DIM_UNIDADE_GESTORA',
  'DIM_FONTE_RECURSO',
  'DIM_NATUREZA_DESPESA',
  'DIM_SUBACAO',
  'DIM_INSTITUCIONAL',
  'DIM_FORNECEDOR',
  'DIM_EMENDA_PARLAMENTAR',
  'DIM_GRUPO_PROG_FINANCEIRA',
  'DIM_NATUREZA_RECEITA',
]

let cachedContext: string | null = null

// Carrega uma vez por processo (ou forçado)
export async function getSchemaContext(force = false): Promise<string> {
  // Usa cache enquanto o processo viver (dados são diários)
  if (cachedContext && !force) return cachedContext

  const start = Date.now()
  const tables = await loadAllSchemas()
  cachedContext = buildPromptContext(tables)
  console.log(`[schema-cache] carregado: ${tables.length} tabelas em ${Date.now() - start}ms`)
  return cachedContext
}

async function loadAllSchemas(): Promise<TableSchema[]> {
  // Carrega os schemas das tabelas do catálogo em paralelo (lotes de 5)
  const schemas: TableSchema[] = []
  for (let i = 0; i < CATALOG_TABLE_NAMES.length; i += 5) {
    const batch = CATALOG_TABLE_NAMES.slice(i, i + 5)
    const results = await Promise.allSettled(
      batch.map(async name => {
        const cols = await agentSchema(name)
        return { name, columns: cols } as TableSchema
      })
    )
    for (const r of results) {
      if (r.status === 'fulfilled') schemas.push(r.value)
    }
  }

  return schemas
}

function buildPromptContext(tables: TableSchema[]): string {
  const lines: string[] = ['## Schema: DWPROD16 (Sybase IQ)\n']

  for (const t of tables) {
    lines.push(`### ${t.name}`)
    for (const c of t.columns) {
      const nullable = c.nullable ? '' : ' NOT NULL'
      lines.push(`  - ${c.name} ${c.type}${nullable}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
