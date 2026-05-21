const pool = require('../db');

async function cadastroProfissional(req, res) {
    const { nome_profissional, especialidade } = req.body;
    const id_empresa = req.empresa.id;

    if (!nome_profissional || !especialidade) {
        return res.status(400).json({ erro: 'nome_profissional e especialidade são obrigatórios.' });
    }

    if (nome_profissional.length > 100) {
        return res.status(400).json({ erro: 'O nome do profissional deve ter no máximo 100 caracteres.' });
    }

    if (especialidade.length > 100) {
        return res.status(400).json({ erro: 'A especialidade deve ter no máximo 100 caracteres.' });
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

async function editarProfissional(req, res) {
    const { id } = req.params;
    const id_empresa = req.empresa.id;
    const { nome_profissional, especialidade } = req.body;

    if (!nome_profissional || !especialidade) {
        return res.status(400).json({ erro: 'nome_profissional e especialidade são obrigatórios.' });
    }

    if (nome_profissional.length > 100) {
        return res.status(400).json({ erro: 'O nome do profissional deve ter no máximo 100 caracteres.' });
    }

    if (especialidade.length > 100) {
        return res.status(400).json({ erro: 'A especialidade deve ter no máximo 100 caracteres.' });
    }

    const profissionalEditado = await pool.query(
        `UPDATE profissionais
         SET nome_profissional = $1, especialidade = $2
         WHERE id = $3 AND id_empresa = $4
         RETURNING id, nome_profissional, especialidade`,
        [nome_profissional, especialidade, id, id_empresa]
    );

    if (profissionalEditado.rows.length === 0) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    return res.json({ profissional: profissionalEditado.rows[0] });
}

async function deletarProfissional(req, res) {
    const { id } = req.params;
    const id_empresa = req.empresa.id;

    const profissionalDeletado = await pool.query(
        `DELETE FROM profissionais
         WHERE id = $1 AND id_empresa = $2
         RETURNING id`,
        [id, id_empresa]
    );

    if (profissionalDeletado.rows.length === 0) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    return res.json({ mensagem: 'Profissional deletado com sucesso.' });
}

module.exports = { cadastroProfissional, listarProfissionais, editarProfissional, deletarProfissional };
