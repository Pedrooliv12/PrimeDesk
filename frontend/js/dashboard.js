const API = 'http://localhost:3000';
const token = localStorage.getItem('token');
const empresa = JSON.parse(localStorage.getItem('empresa') || 'null');

if (!token || !empresa) {
  window.location.href = 'login.html';
}

document.getElementById('nomeEmpresa').textContent = empresa?.nome_empresa || '';

// ── Navegação ──────────────────────────────────────────
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const view = item.dataset.view;
    document.getElementById('viewAgendas').classList.toggle('d-none', view !== 'agendas');
    document.getElementById('viewHorarios').classList.toggle('d-none', view !== 'horarios');
    if (view === 'horarios') inicializarDisponibilidades();
  });
});

document.getElementById('btnSair').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('empresa');
  window.location.href = 'login.html';
});

// ── Helpers ────────────────────────────────────────────
function authHeader() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

function mostrarAlerta(id, mensagem, tipo = 'erro') {
  const el = document.getElementById(id);
  el.textContent = mensagem;
  el.className = `alerta alerta-${tipo}`;
}

function ocultarAlerta(id) {
  document.getElementById(id).className = 'alerta d-none';
}

// ── Profissionais ───────────────────────────────────────
async function carregarProfissionais() {
  try {
    const res = await fetch(`${API}/profissionais`, { headers: authHeader() });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    renderProfissionais(data.profissionais || []);
  } catch {
    mostrarAlerta('alertaProfissional', 'Não foi possível carregar os profissionais.');
  }
}

function renderProfissionais(lista) {
  const grid = document.getElementById('listaProfissionais');
  const empty = document.getElementById('emptyAgendas');

  if (!lista.length) {
    grid.innerHTML = '';
    empty.classList.remove('d-none');
    return;
  }

  empty.classList.add('d-none');
  grid.innerHTML = lista.map(p => `
    <div class="profissional-card">
      <div class="profissional-avatar">${p.nome_profissional.charAt(0).toUpperCase()}</div>
      <div class="profissional-info">
        <h4>${p.nome_profissional}</h4>
        <span class="badge-especialidade">${p.especialidade || 'Sem especialidade'}</span>
      </div>
      <div class="profissional-actions">
        <button class="btn-icon" title="Editar" onclick="abrirEdicao(${p.id}, '${p.nome_profissional}', '${p.especialidade || ''}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn-icon btn-icon-danger" title="Excluir" onclick="excluirProfissional(${p.id})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ── Modal Profissional ──────────────────────────────────
function abrirModalProfissional(titulo = 'Novo Profissional') {
  document.getElementById('modalTituloProfissional').textContent = titulo;
  document.getElementById('modalProfissional').classList.remove('d-none');
  ocultarAlerta('alertaModalProfissional');
}

function fecharModalProfissional() {
  document.getElementById('modalProfissional').classList.add('d-none');
  document.getElementById('formProfissional').reset();
  document.getElementById('profissionalId').value = '';
}

function abrirEdicao(id, nome, especialidade) {
  document.getElementById('profissionalId').value = id;
  document.getElementById('nomeProfissional').value = nome;
  document.getElementById('especialidade').value = especialidade;
  abrirModalProfissional('Editar Profissional');
}

document.getElementById('btnCriarProfissional').addEventListener('click', () => abrirModalProfissional());
document.getElementById('modalCloseProfissional').addEventListener('click', fecharModalProfissional);
document.getElementById('modalProfissional').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalProfissional')) fecharModalProfissional();
});

document.getElementById('formProfissional').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta('alertaModalProfissional');

  const id = document.getElementById('profissionalId').value;
  const nome_profissional = document.getElementById('nomeProfissional').value.trim();
  const especialidade = document.getElementById('especialidade').value.trim();
  const btn = document.getElementById('btnSalvarProfissional');

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const url = id ? `${API}/profissionais/${id}` : `${API}/profissionais`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeader(),
      body: JSON.stringify({ nome_profissional, especialidade }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta('alertaModalProfissional', data.erro || 'Erro ao salvar.');
      return;
    }

    fecharModalProfissional();
    carregarProfissionais();
  } catch {
    mostrarAlerta('alertaModalProfissional', 'Não foi possível conectar ao servidor.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

async function excluirProfissional(id) {
  if (!confirm('Excluir este profissional? Os horários vinculados também serão removidos.')) return;
  try {
    const res = await fetch(`${API}/profissionais/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    if (res.ok) carregarProfissionais();
    else mostrarAlerta('alertaProfissional', 'Erro ao excluir profissional.');
  } catch {
    mostrarAlerta('alertaProfissional', 'Não foi possível conectar ao servidor.');
  }
}

// ── Disponibilidade semanal ──────────────────────────────
const DIAS_SEMANA = [
  { idx: 0, label: 'Dom' },
  { idx: 1, label: 'Seg' },
  { idx: 2, label: 'Ter' },
  { idx: 3, label: 'Qua' },
  { idx: 4, label: 'Qui' },
  { idx: 5, label: 'Sex' },
  { idx: 6, label: 'Sáb' },
];

let profissionalSelecionadoId = null;

async function inicializarDisponibilidades() {
  const select = document.getElementById('profissionalDispSelect');
  select.innerHTML = '<option value="">Selecione um profissional</option>';

  try {
    const res = await fetch(`${API}/profissionais`, { headers: authHeader() });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    const profissionais = data.profissionais || [];

    if (profissionais.length === 0) {
      mostrarAlerta('alertaHorario', 'Cadastre profissionais primeiro para definir suas disponibilidades.', 'erro');
      return;
    }

    profissionais.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.nome_profissional;
      select.appendChild(option);
    });
  } catch {
    mostrarAlerta('alertaHorario', 'Não foi possível carregar os profissionais.');
  }
}

document.getElementById('profissionalDispSelect').addEventListener('change', async (e) => {
  const id = e.target.value;
  profissionalSelecionadoId = id ? parseInt(id) : null;

  const grid = document.getElementById('semanaGrid');
  const empty = document.getElementById('emptyHorarios');

  if (!profissionalSelecionadoId) {
    grid.classList.add('d-none');
    empty.classList.remove('d-none');
    return;
  }

  empty.classList.add('d-none');
  grid.classList.remove('d-none');
  await carregarDisponibilidades();
});

async function carregarDisponibilidades() {
  if (!profissionalSelecionadoId) return;

  try {
    const res = await fetch(
      `${API}/disponibilidades?id_profissional=${profissionalSelecionadoId}`,
      { headers: authHeader() }
    );
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    renderSemana(data.disponibilidades || []);
  } catch {
    mostrarAlerta('alertaHorario', 'Não foi possível carregar as disponibilidades.');
  }
}

function renderSemana(disponibilidades) {
  const grid = document.getElementById('semanaGrid');
  const porDia = {};
  DIAS_SEMANA.forEach(d => { porDia[d.idx] = []; });
  disponibilidades.forEach(d => {
    if (porDia[d.dia_semana]) porDia[d.dia_semana].push(d);
  });
  Object.values(porDia).forEach(arr => arr.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)));

  grid.innerHTML = DIAS_SEMANA.map(dia => {
    const slots = porDia[dia.idx];
    const slotsHtml = slots.length
      ? slots.map(s => `
        <div class="slot-item">
          <span class="slot-tempo">${formatarHora(s.hora_inicio)} - ${formatarHora(s.hora_fim)}</span>
          <button class="slot-remover" title="Remover" onclick="excluirDisponibilidade(${s.id})">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      `).join('')
      : '<div class="dia-vazio">Sem horários</div>';

    return `
      <div class="dia-card">
        <div class="dia-card-header">${dia.label}</div>
        <div class="dia-slots">${slotsHtml}</div>
        <button class="btn-add-slot" onclick="abrirModalDisponibilidade(${dia.idx}, '${dia.label}')">
          <i class="bi bi-plus-lg"></i> Adicionar
        </button>
      </div>
    `;
  }).join('');
}

function formatarHora(hhmmss) {
  return (hhmmss || '').slice(0, 5);
}

function abrirModalDisponibilidade(diaIdx, diaLabel) {
  if (!profissionalSelecionadoId) {
    mostrarAlerta('alertaHorario', 'Selecione um profissional primeiro.', 'erro');
    return;
  }
  document.getElementById('dispDiaSemana').value = diaIdx;
  document.getElementById('modalDispTitulo').textContent = `Adicionar horário — ${diaLabel}`;
  document.getElementById('modalDisponibilidade').classList.remove('d-none');
  ocultarAlerta('alertaModalDisp');
}

function fecharModalDisponibilidade() {
  document.getElementById('modalDisponibilidade').classList.add('d-none');
  document.getElementById('formDisponibilidade').reset();
}

document.getElementById('modalCloseDisp').addEventListener('click', fecharModalDisponibilidade);
document.getElementById('modalDisponibilidade').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalDisponibilidade')) fecharModalDisponibilidade();
});

document.getElementById('formDisponibilidade').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta('alertaModalDisp');

  const dia_semana = parseInt(document.getElementById('dispDiaSemana').value);
  const hora_inicio = document.getElementById('dispHoraInicio').value;
  const hora_fim = document.getElementById('dispHoraFim').value;
  const btn = document.getElementById('btnSalvarDisp');

  if (!hora_inicio || !hora_fim) {
    mostrarAlerta('alertaModalDisp', 'Preencha início e fim.', 'erro');
    return;
  }

  if (hora_inicio >= hora_fim) {
    mostrarAlerta('alertaModalDisp', 'Hora de início deve ser menor que hora de fim.', 'erro');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const res = await fetch(`${API}/disponibilidades`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        id_profissional: profissionalSelecionadoId,
        dia_semana,
        hora_inicio,
        hora_fim,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta('alertaModalDisp', data.erro || 'Erro ao salvar.', 'erro');
      return;
    }

    fecharModalDisponibilidade();
    carregarDisponibilidades();
  } catch {
    mostrarAlerta('alertaModalDisp', 'Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Adicionar';
  }
});

async function excluirDisponibilidade(id) {
  if (!confirm('Remover este horário?')) return;
  try {
    const res = await fetch(`${API}/disponibilidades/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    if (res.ok) carregarDisponibilidades();
    else mostrarAlerta('alertaHorario', 'Erro ao remover horário.');
  } catch {
    mostrarAlerta('alertaHorario', 'Não foi possível conectar ao servidor.');
  }
}

// ── Init ────────────────────────────────────────────────
carregarProfissionais();
