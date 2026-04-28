const pool = require('../db');

async function cadastroProfissional(req, res) {
    const { nome_profissional, especialidade } = req.body;
    const id_empresa = req.empresa.id;

    if (!nome_profissional || !especialidade) {
        return res.status(400).json({ erro: 'nome_profissional e especialidade são obrigatórios.' });
    }

    const profissionalCadastrado = await pool.query(
        `INSERT INTO profissionais (id_empresa, nome_profissional, especialidade)
         VALUES ($1, $2, $3)
         RETURNING id, nome_profissional, especialidade`,
        [id_empresa, nome_profissional, especialidade]
    );

    return res.status(201).json({ profissional: profissionalCadastrado.rows[0] });
}

async function listarProfissionais(req, res) {
    const id_empresa = req.empresa.id;
    const profissionais = await pool.query(
        `SELECT id, nome_profissional, especialidade
         FROM profissionais
         WHERE id_empresa = $1`,
        [id_empresa]
    );

    return res.json({ profissionais: profissionais.rows });
}

module.exports = { cadastroProfissional, listarProfissionais };
