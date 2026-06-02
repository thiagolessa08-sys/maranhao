/**
 * Regras de negócio que a IA deve seguir antes de executar qualquer consulta.
 * Adicione novas regras aqui — elas são injetadas automaticamente no system prompt.
 *
 * Contexto: DW estadual (Sybase IQ DWPROD16). Tabelas sem prefixo de schema.
 */

export const REGRAS_NEGOCIO = `
══════════════════════════════════════════
REGRAS DE NEGÓCIO — OBRIGATÓRIAS
══════════════════════════════════════════

## REGRA 1 — DESPESA: estágios da execução orçamentária

A despesa está em FATO_INTERVENCAO_DOTACAO. Os estágios da execução são colunas de valor distintas:

  • VL_LEI_MAIS_CREDITO        → dotação atualizada (lei orçamentária + créditos adicionais)
  • VL_SALDO_MES_SUPLEMENTACAO → suplementações no mês
  • VL_SALDO_MES_REDUCAO       → reduções no mês
  • VL_SALDO_PRE_EMPENHO       → pré-empenho
  • VL_SALDO_MES_EMPENHADO     → empenhado
  • VL_SALDO_MES_LIQUIDADO     → liquidado
  • VL_SALDO_MES_PAGO          → pago (valor da despesa efetivamente realizada)

Para "quanto foi gasto/pago" use SUM(VL_SALDO_MES_PAGO). Para "quanto foi empenhado",
SUM(VL_SALDO_MES_EMPENHADO). NUNCA some estágios diferentes como se fossem o mesmo valor.

## REGRA 2 — RECEITA: bruta, deduções e líquida

A receita está em FATO_EXECUCAO_RECEITA. A arrecadação bruta é VL_ARRECADACAO_RECEITA.
As deduções ficam em colunas separadas (valores de redução da receita):

  • VL_DEDUCOES_ORCAMENTARIA
  • VL_DEDUCOES_FUNDEB
  • VL_DEDUCOES_TRANSF_CONST_LEGAIS
  • VL_DEDUCOES_TRANSF_CONST_LEGAIS_MUNICIPIOS
  • VL_DEDUCOES_RENUNCIA
  • VL_OUTRAS_DEDUCOES_RECEITA_REALIZADA

Receita Líquida = VL_ARRECADACAO_RECEITA − (soma de todas as deduções acima).

Quando o usuário perguntar sobre receita/arrecadação, mostre a Receita Bruta e, quando
fizer sentido, também as deduções e a Receita Líquida.

## REGRA 3 — SINÔNIMOS

"Arrecadação", "receita", "quanto entrou no caixa", "quanto foi arrecadado" → todos se
referem a FATO_EXECUCAO_RECEITA / VL_ARRECADACAO_RECEITA.
"Gasto", "despesa", "quanto foi pago" → FATO_INTERVENCAO_DOTACAO / VL_SALDO_MES_PAGO.
"Repasse", "transferência financeira" → FATO_REPASSE_FINANCEIRO.

## REGRA 4 — FILTRO POR ANO

Filtre por ano/período via JOIN com DIM_DATA_CALENDARIO (coluna NO_ANO). Se o usuário não
especificar o ano, confirme antes o ano mais recente com dados:
  SELECT MAX(NO_ANO) FROM SEPLAN.DIM_DATA_CALENDARIO
e use esse valor no filtro (não use YEAR(NOW()), pois o relógio pode estar à frente dos dados).
`
