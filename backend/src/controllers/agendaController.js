const pool = require('../db');

async function listarAgendaPublica(req, res) {
  const { slug } = req.params;

  const empresaExiste = await pool.query(
    'SELECT id, nome_empresa FROM empresas WHERE slug = $1',
    [slug]
  );

  if (empresaExiste.rows.length === 0) {
    return res.status(404).json({ erro: 'Empresa não encontrada.' });
  }

  const empresa = empresaExiste.rows[0];

  const profissionais = await pool.query(
    'SELECT id, nome_profissional, especialidade FROM profissionais WHERE id_empresa = $1 ORDER BY nome_profissional',
    [empresa.id]
  );

  if (profissionais.rows.length === 0) {
    return res.json({ empresa: empresa.nome_empresa, profissionais: [] });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximosDias = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() + i);
    proximosDias.push(dia);
  }

  const idsProfissionais = profissionais.rows.map(p => p.id);

  const disponibilidades = await pool.query(
    `SELECT id_profissional, dia_semana, hora_inicio, hora_fim
     FROM disponibilidades_horarias
     WHERE id_profissional = ANY($1)`,
    [idsProfissionais]
  );

  const inicioRange = proximosDias[0];
  const fimRange = new Date(proximosDias[6]);
  fimRange.setHours(23, 59, 59, 999);

  // Busca todos os horários concretos já existentes no período
  const horariosExistentes = await pool.query(
    `SELECT id, id_profissional, data_hora_inicio, status
     FROM horarios_disponiveis
     WHERE id_profissional = ANY($1)
       AND data_hora_inicio >= $2
       AND data_hora_inicio <= $3`,
    [idsProfissionais, inicioRange, fimRange]
  );

  // Mapa: "profissionalId_isoSlot" -> { id, status }
  const horariosMap = {};
  for (const h of horariosExistentes.rows) {
    const chave = `${h.id_profissional}_${new Date(h.data_hora_inicio).toISOString()}`;
    horariosMap[chave] = { id: h.id, status: h.status };
  }

  const disponibilidadesPorProfissional = {};
  for (const d of disponibilidades.rows) {
    if (!disponibilidadesPorProfissional[d.id_profissional]) {
      disponibilidadesPorProfissional[d.id_profissional] = [];
    }
    disponibilidadesPorProfissional[d.id_profissional].push(d);
  }

  // Coleta slots que precisam ser criados no banco
  const slotsParaCriar = [];

  for (const profissional of profissionais.rows) {
    const regras = disponibilidadesPorProfissional[profissional.id] || [];

    for (const dia of proximosDias) {
      const diaSemana = dia.getDay();
      const regrasDoDia = regras.filter(r => r.dia_semana === diaSemana);

      for (const regra of regrasDoDia) {
        const [horaInicio, minInicio] = regra.hora_inicio.split(':').map(Number);
        const [horaFim, minFim] = regra.hora_fim.split(':').map(Number);

        let slotHora = horaInicio;
        let slotMin = minInicio;

        while (slotHora * 60 + slotMin + 60 <= horaFim * 60 + minFim) {
          const dataSlot = new Date(dia);
          dataSlot.setHours(slotHora, slotMin, 0, 0);

          if (dataSlot > new Date()) {
            const chave = `${profissional.id}_${dataSlot.toISOString()}`;
            if (!horariosMap[chave]) {
              slotsParaCriar.push({ id_profissional: profissional.id, data_hora_inicio: dataSlot });
            }
          }

          slotMin += 60;
          if (slotMin >= 60) {
            slotHora += Math.floor(slotMin / 60);
            slotMin = slotMin % 60;
          }
        }
      }
    }
  }

  // Insere os slots novos em lote (INSERT ... ON CONFLICT DO NOTHING para idempotência)
  if (slotsParaCriar.length > 0) {
    const values = slotsParaCriar.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const params = slotsParaCriar.flatMap(s => [s.id_profissional, s.data_hora_inicio]);
    const novoHorarios = await pool.query(
      `INSERT INTO horarios_disponiveis (id_profissional, data_hora_inicio)
       VALUES ${values}
       ON CONFLICT DO NOTHING
       RETURNING id, id_profissional, data_hora_inicio, status`,
      params
    );
    for (const h of novoHorarios.rows) {
      const chave = `${h.id_profissional}_${new Date(h.data_hora_inicio).toISOString()}`;
      horariosMap[chave] = { id: h.id, status: h.status };
    }
  }

  // Monta resposta final com id_horario em cada slot
  const resultado = profissionais.rows.map(profissional => {
    const regras = disponibilidadesPorProfissional[profissional.id] || [];
    const slots = [];

    for (const dia of proximosDias) {
      const diaSemana = dia.getDay();
      const regrasDoDia = regras.filter(r => r.dia_semana === diaSemana);

      for (const regra of regrasDoDia) {
        const [horaInicio, minInicio] = regra.hora_inicio.split(':').map(Number);
        const [horaFim, minFim] = regra.hora_fim.split(':').map(Number);

        let slotHora = horaInicio;
        let slotMin = minInicio;

        while (slotHora * 60 + slotMin + 60 <= horaFim * 60 + minFim) {
          const dataSlot = new Date(dia);
          dataSlot.setHours(slotHora, slotMin, 0, 0);

          if (dataSlot > new Date()) {
            const chave = `${profissional.id}_${dataSlot.toISOString()}`;
            const horario = horariosMap[chave];
            if (horario && horario.status === 'disponivel') {
              slots.push({ id_horario: horario.id, data_hora: dataSlot.toISOString() });
            }
          }

          slotMin += 60;
          if (slotMin >= 60) {
            slotHora += Math.floor(slotMin / 60);
            slotMin = slotMin % 60;
          }
        }
      }
    }

    slots.sort((a, b) => a.data_hora.localeCompare(b.data_hora));

    return {
      id: profissional.id,
      nome: profissional.nome_profissional,
      especialidade: profissional.especialidade,
      slots_disponiveis: slots,
    };
  });

  return res.json({
    empresa: empresa.nome_empresa,
    profissionais: resultado,
  });
}

module.exports = { listarAgendaPublica };
