const pool = require('../config/db');

const createCompany = async (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email) {
    return res.status(400).json({
      message: 'Nome e email são obrigatórios.'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO empresas (nome, email, telefone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nome, email, telefone || null]
    );

    return res.status(201).json({
      message: 'Empresa cadastrada com sucesso.',
      empresa: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao cadastrar empresa:', error);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar empresa.',
      error: error.message
    });
  }
};

const getCompanies = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM empresas ORDER BY id ASC`
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