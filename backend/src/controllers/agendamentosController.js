const pool = require('../db');

async function criarAgendamento(req, res) {
  const { id_horario, nome_cliente, cliente_whatsapp } = req.body;

  if (!id_horario || !nome_cliente || !cliente_whatsapp) {
    return res.status(400).json({ erro: 'id_horario, nome_cliente e cliente_whatsapp são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const horario = await client.query(
      `SELECT id, status FROM horarios_disponiveis WHERE id = $1 FOR UPDATE`,
      [id_horario]
    );

    if (horario.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Horário não encontrado.' });
    }

    if (horario.rows[0].status !== 'disponivel') {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'Horário não está mais disponível.' });
    }

    const agendamento = await client.query(
      `INSERT INTO agendamentos (id_horario, nome_cliente, cliente_whatsapp)
       VALUES ($1, $2, $3)
       RETURNING id, id_horario, nome_cliente, cliente_whatsapp, criado_em`,
      [id_horario, nome_cliente, cliente_whatsapp]
    );

    await client.query(
      `UPDATE horarios_disponiveis SET status = 'agendado' WHERE id = $1`,
      [id_horario]
    );

    await client.query('COMMIT');

    return res.status(201).json({ agendamento: agendamento.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listarAgendamentos(req, res) {
  const id_empresa = req.empresa.id;

  const agendamentos = await pool.query(
    `SELECT a.id, a.nome_cliente, a.cliente_whatsapp,
            a.confirmado, a.lido, a.criado_em,
            h.data_hora_inicio,
            p.nome_profissional, p.especialidade
     FROM agendamentos a
     INNER JOIN horarios_disponiveis h ON a.id_horario = h.id
     INNER JOIN profissionais p ON h.id_profissional = p.id
     WHERE p.id_empresa = $1
     ORDER BY h.data_hora_inicio DESC`,
    [id_empresa]
  );

  return res.json({ agendamentos: agendamentos.rows });
}

async function marcarComoLido(req, res) {
  const { id } = req.params;
  const id_empresa = req.empresa.id;

  const resultado = await pool.query(
    `UPDATE agendamentos a
     SET lido = true
     FROM horarios_disponiveis h
     INNER JOIN profissionais p ON h.id_profissional = p.id
     WHERE a.id = $1
       AND a.id_horario = h.id
       AND p.id_empresa = $2
     RETURNING a.id`,
    [id, id_empresa]
  );

  if (resultado.rows.length === 0) {
    return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  }

  return res.json({ mensagem: 'Agendamento marcado como lido.' });
}

module.exports = { criarAgendamento, listarAgendamentos, marcarComoLido };
