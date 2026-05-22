const jwt = require('jsonwebtoken');

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

module.exports = { autenticarEmpresa };
