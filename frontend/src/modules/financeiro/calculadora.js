// ─────────────────────────────────────────────────────────────────────────────
// Motor de cálculo — Planejamento Financeiro Iasoclin
//
// Funções PURAS: dado um objeto `p` (premissas) e um número de clientes `n`,
// retornam os valores derivados. Nada de estado, nada de I/O. Testável.
//
// Todas as fórmulas seguem o spec do módulo financeiro do admin interno.
// ─────────────────────────────────────────────────────────────────────────────

// Premissas padrão (defaults do spec). Servem de base e de "restaurar padrões".
export const PREMISSAS_PADRAO = {
  // Planos
  precoSolo: 79,
  precoClinica: 197,
  precoPro: 397,
  mixSolo: 0.40,
  mixClinica: 0.40,
  mixPro: 0.20,

  // Custos fixos de infra (R$/mês)
  awsFargate: 450,
  awsRds: 380,
  awsS3: 80,
  awsSqs: 60,
  n8n: 150,
  whatsapp: 0,
  dominio: 20,
  monitoramento: 80,

  // Outros custos fixos (R$/mês)
  contador: 350,
  juridico: 150,
  marketing: 300,
  saasInternos: 120,
  contingenciaFixa: 200,

  // Custos variáveis
  gatewayPct: 0.0199,
  iaRCliMes: 8.00,
  assinaturaDigital: 1.50,
  cs: 5.00,
  contingenciaVarPct: 0.02,

  // Sócios — participação no lucro (sem pró-labore)
  pctEnzo: 0.60,
  pctAnaFlavia: 0.05,
  pctGean: 0.10,
  pctEuriane: 0.25,
  pctReserva: 0.00,

  // Política de caixa mínimo
  caixaMultiplicador: 1.5,
  provisaoTributaria: 0.10,
  churnBuffer: 0.10,
  caixaAtual: 0, // quanto já está reservado em caixa hoje (R$)

  // Asaas rev share (conservador)
  asaasTicketProc: 150,
  asaasProcsCliente: 4,
  asaasPctAdesao: 0.20,
  asaasRevShare: 0.40,
  asaasFatorConservador: 0.50,
};

// Milestones fixos da projeção
export const MILESTONES = [25, 50, 75, 100, 150, 200, 300, 400, 500];

// ── Custos fixos ──────────────────────────────────────────────────────────────
export function totalInfra(p) {
  return p.awsFargate + p.awsRds + p.awsS3 + p.awsSqs + p.n8n + p.whatsapp + p.dominio + p.monitoramento;
}

export function totalOutrosFixos(p) {
  return p.contador + p.juridico + p.marketing + p.saasInternos + p.contingenciaFixa;
}

export function totalCustosFixos(p) {
  return totalInfra(p) + totalOutrosFixos(p);
}

// ── Receita ─────────────────────────────────────────────────────────────────
export function ticketMedio(p) {
  return p.precoSolo * p.mixSolo + p.precoClinica * p.mixClinica + p.precoPro * p.mixPro;
}

export function mrr(p, n) {
  return n * ticketMedio(p);
}

export function revShareAsaas(p, n) {
  return n * p.asaasProcsCliente * p.asaasPctAdesao * p.asaasRevShare * p.asaasFatorConservador;
}

export function receitaTotal(p, n) {
  return mrr(p, n) + revShareAsaas(p, n);
}

// ── Custos variáveis ──────────────────────────────────────────────────────────
export function custosVariaveis(p, n) {
  return mrr(p, n) * p.gatewayPct
    + n * (p.iaRCliMes + p.assinaturaDigital + p.cs)
    + receitaTotal(p, n) * p.contingenciaVarPct;
}

// ── Margens e resultado ───────────────────────────────────────────────────────
export function margemBruta(p, n) {
  return receitaTotal(p, n) - custosVariaveis(p, n);
}

export function margemBrutaPct(p, n) {
  const r = receitaTotal(p, n);
  return r === 0 ? 0 : margemBruta(p, n) / r;
}

export function ebitda(p, n) {
  return receitaTotal(p, n) - custosVariaveis(p, n) - totalCustosFixos(p);
}

export function ebitdaPct(p, n) {
  const r = receitaTotal(p, n);
  return r === 0 ? 0 : ebitda(p, n) / r;
}

// ── Política de caixa ─────────────────────────────────────────────────────────
// Caixa mínimo é a RESERVA-ALVO (estoque), não uma despesa mensal: representa
// quanto precisa estar guardado para cobrir X meses de gasto + buffer de churn.
export function caixaMinimo(p, n) {
  return totalCustosFixos(p) * p.caixaMultiplicador
    + receitaTotal(p, n) * p.churnBuffer;
}

// Quanto ainda falta reservar para atingir o caixa mínimo, dado o caixa atual.
// Uma vez atingida a meta, não há mais nada a reter (libera o lucro).
export function faltaReservar(p, n) {
  return Math.max(0, caixaMinimo(p, n) - (p.caixaAtual ?? 0));
}

// Disponível para distribuir: EBITDA menos impostos, menos APENAS o que ainda
// falta reservar este mês (não desconta o caixa mínimo inteiro todo mês).
export function lucroDisponivel(p, n) {
  const liquido = ebitda(p, n) * (1 - p.provisaoTributaria);
  return Math.max(0, liquido - faltaReservar(p, n));
}

export function ficaNaEmpresa(p, n) {
  return Math.max(0, ebitda(p, n)) - lucroDisponivel(p, n);
}

// ── Retirada por sócio ────────────────────────────────────────────────────────
export function retiradaSocio(p, n, pctSocio) {
  return lucroDisponivel(p, n) * pctSocio;
}

// ── Calculadora reversa — ticket mínimo para uma margem alvo ──────────────────
export function ticketMinimo(p, margemAlvo, n) {
  const denom = n * (1 - p.gatewayPct - p.contingenciaVarPct - margemAlvo);
  if (denom <= 0) return Infinity; // margem inatingível com esses parâmetros
  return (totalCustosFixos(p) + n * (p.iaRCliMes + p.assinaturaDigital + p.cs)) / denom;
}

// ── Helpers de validação (mix e sócios devem somar 100%) ──────────────────────
export function somaMix(p) {
  return p.mixSolo + p.mixClinica + p.mixPro;
}

export function somaSocios(p) {
  return p.pctEnzo + p.pctAnaFlavia + p.pctGean + p.pctEuriane + p.pctReserva;
}

// Primeiro milestone em que o EBITDA fica positivo (break-even). null se nenhum.
export function milestoneBreakEven(p, milestones = MILESTONES) {
  return milestones.find((n) => ebitda(p, n) > 0) ?? null;
}
