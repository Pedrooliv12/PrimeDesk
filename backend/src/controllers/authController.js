const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

async function cadastroEmpresa(req, res) {
  const { nome_empresa, senha_empresa } = req.body;
  const email_empresa = req.body.email_empresa?.toLowerCase().trim();

  if (!nome_empresa || !email_empresa || !senha_empresa) {
    return res.status(400).json({ erro: 'nome_empresa, email_empresa e senha_empresa são obrigatórios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_empresa)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  if (senha_empresa.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const emailExistente = await pool.query(
    'SELECT id FROM empresas WHERE email_empresa = $1',
    [email_empresa]
  );
  if (emailExistente.rows.length > 0) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(senha_empresa, 10);

  const empresaCadastrada = await pool.query(
    `INSERT INTO empresas (nome_empresa, email_empresa, senha_empresa)
     VALUES ($1, $2, $3)
     RETURNING id, nome_empresa, email_empresa`,
    [nome_empresa, email_empresa, senhaHash]
  );

  return res.status(201).json({ empresa: empresaCadastrada.rows[0] });
}

async function loginEmpresa(req, res) {
  const { senha_empresa } = req.body;
  const email_empresa = req.body.email_empresa?.toLowerCase().trim();

  if (!email_empresa || !senha_empresa) {
    return res.status(400).json({ erro: 'email_empresa e senha_empresa são obrigatórios.' });
  }

  const empresaBuscada = await pool.query(
    'SELECT * FROM empresas WHERE email_empresa = $1',
    [email_empresa]
  );

  const empresa = empresaBuscada.rows[0];

  if (!empresa) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const senhaCorreta = await bcrypt.compare(senha_empresa, empresa.senha_empresa);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { id: empresa.id, nome_empresa: empresa.nome_empresa },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return res.json({
    token,
    empresa: {
      id: empresa.id,
      nome_empresa: empresa.nome_empresa,
      email_empresa: empresa.email_empresa,
    },
  });
}

module.exports = { cadastroEmpresa, loginEmpresa };
