const DIAS_TRIAL = 30;
const MS_POR_DIA = 1000 * 60 * 60 * 24;

function calcularStatusAssinatura(empresa) {
  const agora = Date.now();
  const assinaturaAte = empresa.assinatura_ate ? new Date(empresa.assinatura_ate).getTime() : null;

  if (assinaturaAte && assinaturaAte > agora) {
    const diasRestantes = Math.ceil((assinaturaAte - agora) / MS_POR_DIA);
    return { ativa: true, tipo: 'assinatura', dias_restantes: diasRestantes, expira_em: empresa.assinatura_ate };
  }

  const trialInicio = empresa.trial_inicio ? new Date(empresa.trial_inicio).getTime() : agora;
  const trialFim = trialInicio + DIAS_TRIAL * MS_POR_DIA;

  if (trialFim > agora) {
    const diasRestantes = Math.ceil((trialFim - agora) / MS_POR_DIA);
    return { ativa: true, tipo: 'trial', dias_restantes: diasRestantes, expira_em: new Date(trialFim).toISOString() };
  }

  return { ativa: false, tipo: 'expirada', dias_restantes: 0, expira_em: null };
}

module.exports = { calcularStatusAssinatura, DIAS_TRIAL };
