const pool = require('../db');

async function criarDisponibilidade(req, res) {
  const { id_profissional, dia_semana, hora_inicio, hora_fim } = req.body;
  const id_empresa = req.empresa.id;

  if (id_profissional === undefined || dia_semana === undefined || !hora_inicio || !hora_fim) {
    return res.status(400).json({ erro: 'id_profissional, dia_semana, hora_inicio e hora_fim são obrigatórios.' });
  }

  if (dia_semana < 0 || dia_semana > 6) {
    return res.status(400).json({ erro: 'dia_semana deve ser entre 0 (domingo) e 6 (sábado).' });
  }

  if (hora_inicio >= hora_fim) {
    return res.status(400).json({ erro: 'hora_inicio deve ser menor que hora_fim.' });
  }

  const profissionalDaEmpresa = await pool.query(
    'SELECT id FROM profissionais WHERE id = $1 AND id_empresa = $2',
    [id_profissional, id_empresa]
  );

  if (profissionalDaEmpresa.rows.length === 0) {
    return res.status(404).json({ erro: 'Profissional não encontrado.' });
  }

  const disponibilidadeCriada = await pool.query(
    `INSERT INTO disponibilidades_horarias (id_profissional, dia_semana, hora_inicio, hora_fim)
     VALUES ($1, $2, $3, $4)
     RETURNING id, id_profissional, dia_semana, hora_inicio, hora_fim`,
    [id_profissional, dia_semana, hora_inicio, hora_fim]
  );

  return res.status(201).json({ disponibilidade: disponibilidadeCriada.rows[0] });
}

async function listarDisponibilidades(req, res) {
  const id_empresa = req.empresa.id;
  const { id_profissional } = req.query;

  const params = [id_empresa];
  let filtroProfissional = '';

  if (id_profissional) {
    params.push(id_profissional);
    filtroProfissional = 'AND d.id_profissional = $2';
  }

  const disponibilidades = await pool.query(
    `SELECT d.id, d.id_profissional, d.dia_semana, d.hora_inicio, d.hora_fim, p.nome_profissional
     FROM disponibilidades_horarias d
     INNER JOIN profissionais p ON d.id_profissional = p.id
     WHERE p.id_empresa = $1 ${filtroProfissional}
     ORDER BY d.id_profissional, d.dia_semana, d.hora_inicio`,
    params
  );

  return res.json({ disponibilidades: disponibilidades.rows });
}

async function deletarDisponibilidade(req, res) {
  const { id } = req.params;
  const id_empresa = req.empresa.id;

  const disponibilidadeDeletada = await pool.query(
    `DELETE FROM disponibilidades_horarias d
     USING profissionais p
     WHERE d.id = $1 AND d.id_profissional = p.id AND p.id_empresa = $2
     RETURNING d.id`,
    [id, id_empresa]
  );

  if (disponibilidadeDeletada.rows.length === 0) {
    return res.status(404).json({ erro: 'Disponibilidade não encontrada.' });
  }

  return res.json({ mensagem: 'Disponibilidade deletada com sucesso.' });
}

module.exports = { criarDisponibilidade, listarDisponibilidades, deletarDisponibilidade };
