const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const createCompany = async (req, res) => {
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
      return res.status(409).json({
        message: 'Email já cadastrado.'
      });
    }

    const senhaHash = await bcrypt.hash(senha_empresa, 10);

    const result = await pool.query(
      `INSERT INTO empresas (nome_empresa, email_empresa, senha_empresa)
       VALUES ($1, $2, $3)
       RETURNING id, nome_empresa, email_empresa, status_assinatura`,
      [nome_empresa, email_empresa, senhaHash]
    );

    return res.status(201).json({
      message: 'Empresa cadastrada com sucesso.',
      empresa: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao cadastrar empresa:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Email já cadastrado.'
      });
    }

    return res.status(500).json({
      message: 'Erro interno ao cadastrar empresa.',
      error: error.message
    });
  }
};

const getCompanies = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome_empresa, email_empresa, status_assinatura
       FROM empresas ORDER BY id ASC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);

    return res.status(500).json({
      message: 'Erro interno ao buscar empresas.',
      error: error.message
    });
  }
};

module.exports = {
  createCompany,
  getCompanies
};