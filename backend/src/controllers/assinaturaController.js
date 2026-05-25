const pool = require('../db');
const { calcularStatusAssinatura, DIAS_TRIAL } = require('../utils/assinatura');

const PRECO_MENSAL = 49.90;
const DIAS_ASSINATURA = 30;

async function obterStatusAssinatura(req, res) {
  const resultado = await pool.query(
    'SELECT trial_inicio, assinatura_ate FROM empresas WHERE id = $1',
    [req.empresa.id]
  );
  const empresa = resultado.rows[0];

  if (!empresa) {
    return res.status(404).json({ erro: 'Empresa não encontrada.' });
  }

  const status = calcularStatusAssinatura(empresa);
  return res.json({ ...status, preco_mensal: PRECO_MENSAL, dias_trial: DIAS_TRIAL });
}

async function assinarPlano(req, res) {
  const resultado = await pool.query(
    'SELECT assinatura_ate FROM empresas WHERE id = $1',
    [req.empresa.id]
  );
  const empresa = resultado.rows[0];
  if (!empresa) {
    return res.status(404).json({ erro: 'Empresa não encontrada.' });
  }

  const agora = Date.now();
  const baseAtual = empresa.assinatura_ate ? new Date(empresa.assinatura_ate).getTime() : 0;
  const base = baseAtual > agora ? baseAtual : agora;
  const novaData = new Date(base + DIAS_ASSINATURA * 24 * 60 * 60 * 1000);

  await pool.query(
    'UPDATE empresas SET assinatura_ate = $1 WHERE id = $2',
    [novaData, req.empresa.id]
  );

  return res.json({
    mensagem: 'Assinatura ativada com sucesso.',
    assinatura_ate: novaData.toISOString(),
    valor_cobrado: PRECO_MENSAL,
  });
}

module.exports = { obterStatusAssinatura, assinarPlano };
