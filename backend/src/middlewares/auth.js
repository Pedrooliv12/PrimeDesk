const jwt = require('jsonwebtoken');
const pool = require('../db');
const { calcularStatusAssinatura } = require('../utils/assinatura');

function autenticarEmpresa(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const dadosToken = jwt.verify(token, process.env.JWT_SECRET);
    req.empresa = dadosToken;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

async function exigirAssinaturaAtiva(req, res, next) {
  const resultado = await pool.query(
    'SELECT trial_inicio, assinatura_ate FROM empresas WHERE id = $1',
    [req.empresa.id]
  );
  const empresa = resultado.rows[0];

  if (!empresa) {
    return res.status(401).json({ erro: 'Empresa não encontrada.' });
  }

  const status = calcularStatusAssinatura(empresa);
  if (!status.ativa) {
    return res.status(403).json({ erro: 'assinatura_expirada', mensagem: 'Sua assinatura expirou. Renove para continuar.' });
  }

  req.assinatura = status;
  next();
}

module.exports = { autenticarEmpresa, exigirAssinaturaAtiva };
