const pool = require('../db');

async function criarHorario(req, res) {
  const { id_profissional, data_hora_inicio } = req.body;
  const id_empresa = req.empresa.id;

  if (!id_profissional || !data_hora_inicio) {
    return res.status(400).json({ erro: 'id_profissional e data_hora_inicio são obrigatórios.' });
  }

  const profissionalDaEmpresa = await pool.query(
    'SELECT id FROM profissionais WHERE id = $1 AND id_empresa = $2',
    [id_profissional, id_empresa]
  );

  if (profissionalDaEmpresa.rows.length === 0) {
    return res.status(404).json({ erro: 'Profissional não encontrado.' });
  }

  const horarioCriado = await pool.query(
    `INSERT INTO horarios_disponiveis (id_profissional, data_hora_inicio)
     VALUES ($1, $2)
     RETURNING id, id_profissional, data_hora_inicio, status`,
    [id_profissional, data_hora_inicio]
  );

  return res.status(201).json({ horario: horarioCriado.rows[0] });
}

async function listarHorarios(req, res) {
  const id_empresa = req.empresa.id;

  const horarios = await pool.query(
    `SELECT h.id, h.id_profissional, h.data_hora_inicio, h.status, p.nome_profissional
     FROM horarios_disponiveis h
     INNER JOIN profissionais p ON h.id_profissional = p.id
     WHERE p.id_empresa = $1
     ORDER BY h.data_hora_inicio ASC`,
    [id_empresa]
  );

  return res.json({ horarios: horarios.rows });
}

async function deletarHorario(req, res) {
  const { id } = req.params;
  const id_empresa = req.empresa.id;

  const horarioDeletado = await pool.query(
    `DELETE FROM horarios_disponiveis h
     USING profissionais p
     WHERE h.id = $1 AND h.id_profissional = p.id AND p.id_empresa = $2
     RETURNING h.id`,
    [id, id_empresa]
  );

  if (horarioDeletado.rows.length === 0) {
    return res.status(404).json({ erro: 'Horário não encontrado.' });
  }

  return res.json({ mensagem: 'Horário deletado com sucesso.' });
}

module.exports = { criarHorario, listarHorarios, deletarHorario };
