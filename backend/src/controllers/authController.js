const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

function gerarSlug(nomeEmpresa) {
  const base = nomeEmpresa.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40);
  const sufixo = Math.random().toString(36).slice(2, 6);
  return `${base}-${sufixo}`;
}

async function cadastroEmpresa(req, res) {
  const { nome_empresa, senha_empresa } = req.body;
  const email_empresa = req.body.email_empresa?.toLowerCase().trim();

  if (!nome_empresa || !email_empresa || !senha_empresa) {
    return res.status(400).json({ erro: 'nome_empresa, email_empresa e senha_empresa são obrigatórios.' });
  }

  if (nome_empresa.length > 150) {
    return res.status(400).json({ erro: 'O nome da empresa deve ter no máximo 150 caracteres.' });
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(nome_empresa)) {
    return res.status(400).json({ erro: 'O nome da empresa só pode conter letras, números e espaços.' });
  }

  if (email_empresa.length > 255) {
    return res.status(400).json({ erro: 'O e-mail deve ter no máximo 255 caracteres.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_empresa)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  if (senha_empresa.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  if (senha_empresa.length > 72) {
    return res.status(400).json({ erro: 'A senha deve ter no máximo 72 caracteres.' });
  }

  const emailExistente = await pool.query(
    'SELECT id FROM empresas WHERE email_empresa = $1',
    [email_empresa]
  );
  if (emailExistente.rows.length > 0) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(senha_empresa, 10);
  const slug = gerarSlug(nome_empresa);

  const empresaCadastrada = await pool.query(
    `INSERT INTO empresas (nome_empresa, email_empresa, senha_empresa, slug)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nome_empresa, email_empresa, slug`,
    [nome_empresa, email_empresa, senhaHash, slug]
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
    'SELECT id, nome_empresa, email_empresa, senha_empresa, slug FROM empresas WHERE email_empresa = $1',
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
      slug: empresa.slug,
    },
  });
}

module.exports = { cadastroEmpresa, loginEmpresa };
