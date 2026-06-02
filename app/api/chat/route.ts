import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { agentQuery } from '@/lib/agent'
import { getSchemaContext } from '@/lib/schema-cache'
import { getCatalog, catalogToPromptContext } from '@/lib/catalog-cache'
import { REGRAS_NEGOCIO } from '@/lib/regras-negocio'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'executar_query',
    description: 'Executa uma query SELECT no Sybase IQ. Use APENAS para buscar dados — nunca para explorar metadados do banco.',
    input_schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'Query SELECT válida para Sybase IQ' },
        limit: { type: 'number', description: 'Máximo de linhas (padrão 200)' },
      },
      required: ['sql'],
    },
  },
]

function buildSystemPrompt(schemaContext: string, catalogContext: string): string {
  return `Você é um analista de dados sênior do Governo do Estado do Maranhão.
Seu trabalho é RESPONDER PERGUNTAS DE NEGÓCIO com dados reais do banco Sybase IQ (DW estadual DWPROD16).

══════════════════════════════════════════
PROIBIDO — NUNCA FAÇA ISSO:
══════════════════════════════════════════
✗ Consultar SYS.SYSTAB, SYS.SYSTABCOL, INFORMATION_SCHEMA ou qualquer tabela de metadados
✗ Rodar queries de "exploração" para descobrir tabelas ou colunas
✗ Fazer mais de 3 queries por resposta
✗ Responder sem interpretar os dados (não liste só os resultados — analise)
✗ Usar LIMIT (Sybase IQ usa TOP N)
✗ Usar UPPER() ou LOWER() para comparar strings
✗ Usar prefixo de schema nas tabelas — use o nome puro (ex: FATO_INTERVENCAO_DOTACAO)

══════════════════════════════════════════
VOCÊ JÁ SABE TUDO SOBRE O BANCO:
══════════════════════════════════════════
O schema completo está listado abaixo. Leia-o, identifique as tabelas certas e execute a query diretamente.
NÃO faça queries para descobrir o schema — ele está aqui.

══════════════════════════════════════════
SINTAXE OBRIGATÓRIA — SYBASE IQ:
══════════════════════════════════════════
• TOP N:        SELECT TOP 20 col FROM FATO_INTERVENCAO_DOTACAO  (nunca LIMIT)
• Datas:        YEAR(col), MONTH(col), DATEFORMAT(col,'yyyy-mm-dd')
• Cast:         CONVERT(NUMERIC,col) ou CAST(col AS NUMERIC)
• Nulos:        ISNULL(col, 0)
• Concatenar:   col1 || ' ' || col2
• Sem GROUP_CONCAT: use LIST(col, ',')
• JOINs sempre via chaves SK (ex: f.SK_UNIDADE_GESTORA = u.SK_UNIDADE_GESTORA)
• Nomes de colunas: use EXATAMENTE como estão no schema (case-sensitive)
• Se a query falhar: leia o erro, corrija e tente de novo (máx 2 tentativas)

══════════════════════════════════════════
COMO RESPONDER:
══════════════════════════════════════════
1. Identifique as tabelas relevantes no schema abaixo
2. Execute a query (máx 2-3 queries por resposta)
3. ESTRUTURA OBRIGATÓRIA da resposta — nesta ordem exata:
   a) **Insights** primeiro: escreva 2-4 frases destacando o número mais importante,
      tendências, comparações ou alertas. Use **negrito** para valores-chave.
   b) **Tabela** depois: apresente os dados em formato markdown (| col | col |).
   c) **Conclusão** opcional: uma frase final se houver algo relevante a acrescentar.
   NUNCA coloque a tabela antes dos insights. Sempre texto analítico → tabela.
4. NÃO inclua blocos \`\`\`sql na resposta — a query já fica disponível no painel "Ver query"
5. NUNCA gere gráficos em texto, ASCII art, blocos de código ou caracteres especiais.
   O frontend já converte automaticamente tabelas markdown em gráficos interativos.
   Para mostrar um gráfico: simplesmente retorne os dados em tabela markdown (| col | col |).
6. Se o dado não existir, diga claramente qual tabela foi consultada e o que encontrou

${REGRAS_NEGOCIO}
══════════════════════════════════════════
${catalogContext ? catalogContext + '\n\n' : '⚠️  Catálogo semântico não gerado ainda. Acesse /catalogo para gerar.\n\n'}══════════════════════════════════════════
SCHEMA TÉCNICO COMPLETO — DWPROD16:
══════════════════════════════════════════
${schemaContext}
══════════════════════════════════════════`
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return new Response('Não autenticado', { status: 401 })

  const { messages, forceRefreshSchema } = await req.json()

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  async function send(payload: object) {
    await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
  }

  async function run() {
    try {
      const schemaContext = await getSchemaContext(forceRefreshSchema ?? false)
      const catalog = getCatalog()
      const catalogContext = catalog ? catalogToPromptContext(catalog) : ''
      const systemPrompt = buildSystemPrompt(schemaContext, catalogContext)

      const msgs: Anthropic.MessageParam[] = [...messages]
      let queryCount = 0
      const MAX_QUERIES = 3

      for (let turn = 0; turn < 8; turn++) {
        let response: Anthropic.Message | null = null
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            response = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 4096,
              system: systemPrompt,
              tools: queryCount >= MAX_QUERIES ? [] : TOOLS,
              messages: msgs,
            })
            break
          } catch (err: unknown) {
            const status = (err as { status?: number }).status
            if (status === 529 && attempt < 3) {
              const wait = (attempt + 1) * 8000
              await send({ type: 'text', text: `_(API sobrecarregada, tentando novamente em ${wait / 1000}s…)_\n` })
              await new Promise(r => setTimeout(r, wait))
              continue
            }
            throw err
          }
        }
        if (!response) throw new Error('Falha após 4 tentativas (API overloaded)')

        for (const block of response.content) {
          if (block.type === 'text' && block.text) {
            await send({ type: 'text', text: block.text })
          }
        }

        if (response.stop_reason === 'end_turn') break

        if (response.stop_reason === 'tool_use') {
          msgs.push({ role: 'assistant', content: response.content })
          const toolResults: Anthropic.ToolResultBlockParam[] = []

          for (const block of response.content) {
            if (block.type !== 'tool_use' || block.name !== 'executar_query') continue

            queryCount++
            const input = block.input as { sql: string; limit?: number }

            await send({ type: 'tool_start', name: 'executar_query', sql: input.sql })

            let resultContent: string
            try {
              const result = await agentQuery(input.sql, input.limit ?? 200)
              resultContent = JSON.stringify(result)
              await send({ type: 'tool_end', name: 'executar_query', rows: result.count })
            } catch (e) {
              resultContent = JSON.stringify({ error: String(e) })
              await send({ type: 'tool_end', name: 'executar_query', error: String(e) })
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultContent,
            })
          }

          msgs.push({ role: 'user', content: toolResults })
        }
      }
    } catch (e) {
      await send({ type: 'error', text: `Erro: ${String(e)}` })
    } finally {
      await send({ type: 'done' })
      await writer.close()
    }
  }

  run()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
