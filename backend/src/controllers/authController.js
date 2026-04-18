const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const register = async (req, res) => {
  const { nome_empresa, email_empresa, senha_empresa } = req.body;

  if (!nome_empresa || !email_empresa || !senha_empresa) {
    return res.status(400).json({
      message: 'nome_empresa, email_empresa e senha_empresa são obrigatórios.'
    });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM empresas WHERE email_empresa = $1',
      [email_empresa]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha_empresa, 10);

    const result = await pool.query(
      `INSERT INTO empresas (nome_empresa, email_empresa, senha_empresa)
       VALUES ($1, $2, $3)
       RETURNING id, nome_empresa, email_empresa, status_assinatura`,
      [nome_empresa, email_empresa, senhaHash]
    );

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso.',
      empresa: result.rows[0]
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({
      message: 'Erro interno no registro.',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  const { email_empresa, senha_empresa } = req.body;

  if (!email_empresa || !senha_empresa) {
    return res.status(400).json({
      message: 'email_empresa e senha_empresa são obrigatórios.'
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, nome_empresa, email_empresa, senha_empresa, status_assinatura
       FROM empresas WHERE email_empresa = $1`,
      [email_empresa]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    const empresa = result.rows[0];
    const senhaValida = await bcrypt.compare(senha_empresa, empresa.senha_empresa);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    delete empresa.senha_empresa;

    return res.status(200).json({
      message: 'Login bem-sucedido.',
      empresa
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      message: 'Erro interno no login.',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login
};
