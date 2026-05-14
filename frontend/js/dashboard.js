const API = 'http://localhost:3000';
const token = localStorage.getItem('token');
const empresa = JSON.parse(localStorage.getItem('empresa') || 'null');

if (!token || !empresa) {
  window.location.href = 'login.html';
}

document.getElementById('nomeEmpresa').textContent = empresa?.nome_empresa || '';

const navItems = document.querySelectorAll('.nav-item[data-view]');
const viewAgendas = document.getElementById('viewAgendas');
const viewHorarios = document.getElementById('viewHorarios');

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const view = item.dataset.view;
    viewAgendas.classList.toggle('d-none', view !== 'agendas');
    viewHorarios.classList.toggle('d-none', view !== 'horarios');
    if (view === 'horarios') inicializarDisponibilidades();
  });
});

document.getElementById('btnSair').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('empresa');
  window.location.href = 'login.html';
});

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

function abrirModal(id) {
  document.getElementById(id).classList.remove('d-none');
}

function fecharModal(id, formId) {
  document.getElementById(id).classList.add('d-none');
  if (formId) document.getElementById(formId).reset();
}

function setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.textContent = loading ? 'Salvando...' : btn.dataset.originalText;
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

let profissionaisCached = null;

async function carregarProfissionais() {
  try {
    const res = await fetch(`${API}/profissionais`, { headers: authHeader() });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    profissionaisCached = data.profissionais || [];
    renderProfissionais(profissionaisCached);
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
  grid.innerHTML = lista.map(p => {
    const nome = escapeHtml(p.nome_profissional || '');
    const especialidade = escapeHtml(p.especialidade || 'Sem especialidade');
    const inicial = (p.nome_profissional || 'N').charAt(0).toUpperCase();
    return `
      <div class="profissional-card" data-id="${p.id}" data-nome="${nome}" data-especialidade="${especialidade}">
        <div class="profissional-avatar">${escapeHtml(inicial)}</div>
        <div class="profissional-info">
          <h4>${nome}</h4>
          <span class="badge-especialidade">${especialidade}</span>
        </div>
        <div class="profissional-actions">
          <button class="btn-icon btn-editar" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon btn-icon-danger btn-deletar" title="Excluir"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

const modalProfissional = document.getElementById('modalProfissional');
const formProfissional = document.getElementById('formProfissional');
const modalTituloProfissional = document.getElementById('modalTituloProfissional');
const profissionalIdInput = document.getElementById('profissionalId');

document.getElementById('btnCriarProfissional').addEventListener('click', () => {
  modalTituloProfissional.textContent = 'Novo Profissional';
  profissionalIdInput.value = '';
  abrirModal('modalProfissional');
  ocultarAlerta('alertaModalProfissional');
});

document.getElementById('modalCloseProfissional').addEventListener('click', () => fecharModal('modalProfissional', 'formProfissional'));
modalProfissional.addEventListener('click', (e) => {
  if (e.target === modalProfissional) fecharModal('modalProfissional', 'formProfissional');
});

document.getElementById('listaProfissionais').addEventListener('click', (e) => {
  const card = e.target.closest('.profissional-card');
  if (!card) return;

  if (e.target.closest('.btn-editar')) {
    profissionalIdInput.value = card.dataset.id;
    document.getElementById('nomeProfissional').value = card.dataset.nome;
    document.getElementById('especialidade').value = card.dataset.especialidade;
    modalTituloProfissional.textContent = 'Editar Profissional';
    abrirModal('modalProfissional');
    ocultarAlerta('alertaModalProfissional');
  } else if (e.target.closest('.btn-deletar')) {
    excluirProfissional(card.dataset.id);
  }
});

formProfissional.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta('alertaModalProfissional');

  const id = profissionalIdInput.value;
  const nome_profissional = document.getElementById('nomeProfissional').value.trim();
  const especialidade = document.getElementById('especialidade').value.trim();
  const btn = document.getElementById('btnSalvarProfissional');

  btn.dataset.originalText = 'Salvar';
  setButtonLoading('btnSalvarProfissional', true);

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

    fecharModal('modalProfissional', 'formProfissional');
    carregarProfissionais();
  } catch {
    mostrarAlerta('alertaModalProfissional', 'Não foi possível conectar ao servidor.');
  } finally {
    setButtonLoading('btnSalvarProfissional', false);
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
    const profissionais = profissionaisCached || await carregarProfissionalsList();
    if (!profissionais || profissionais.length === 0) {
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

async function carregarProfissionalsList() {
  if (profissionaisCached) return profissionaisCached;
  const res = await fetch(`${API}/profissionais`, { headers: authHeader() });
  if (res.status === 401) { window.location.href = 'login.html'; return null; }
  const data = await res.json();
  return (profissionaisCached = data.profissionais || []);
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
      ? slots.map(s => {
          const inicio = escapeHtml(s.hora_inicio.slice(0, 5));
          const fim = escapeHtml(s.hora_fim.slice(0, 5));
          return `
            <div class="slot-item" data-id="${s.id}">
              <span class="slot-tempo">${inicio} - ${fim}</span>
              <button class="slot-remover" title="Remover"><i class="bi bi-x-lg"></i></button>
            </div>
          `;
        }).join('')
      : '<div class="dia-vazio">Sem horários</div>';

    return `
      <div class="dia-card">
        <div class="dia-card-header">${dia.label}</div>
        <div class="dia-slots">${slotsHtml}</div>
        <button class="btn-add-slot" data-dia-idx="${dia.idx}" data-dia-label="${dia.label}">
          <i class="bi bi-plus-lg"></i> Adicionar
        </button>
      </div>
    `;
  }).join('');

  setupSlotsEventListeners();
}

const modalDisponibilidade = document.getElementById('modalDisponibilidade');
const formDisponibilidade = document.getElementById('formDisponibilidade');
const modalDispTitulo = document.getElementById('modalDispTitulo');
const dispDiaSemana = document.getElementById('dispDiaSemana');

document.getElementById('modalCloseDisp').addEventListener('click', () => fecharModal('modalDisponibilidade', 'formDisponibilidade'));
modalDisponibilidade.addEventListener('click', (e) => {
  if (e.target === modalDisponibilidade) fecharModal('modalDisponibilidade', 'formDisponibilidade');
});

document.getElementById('semanaGrid').addEventListener('click', (e) => {
  const btnAdd = e.target.closest('.btn-add-slot');
  if (btnAdd) {
    if (!profissionalSelecionadoId) {
      mostrarAlerta('alertaHorario', 'Selecione um profissional primeiro.', 'erro');
      return;
    }
    dispDiaSemana.value = btnAdd.dataset.diaIdx;
    modalDispTitulo.textContent = `Adicionar horário — ${btnAdd.dataset.diaLabel}`;
    abrirModal('modalDisponibilidade');
    ocultarAlerta('alertaModalDisp');
  }
});

function setupSlotsEventListeners() {
  document.querySelectorAll('.slot-remover').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slotItem = btn.closest('.slot-item');
      excluirDisponibilidade(slotItem.dataset.id);
    });
  });
}

formDisponibilidade.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta('alertaModalDisp');

  const dia_semana = parseInt(dispDiaSemana.value);
  const hora_inicio = document.getElementById('dispHoraInicio').value;
  const hora_fim = document.getElementById('dispHoraFim').value;

  if (!hora_inicio || !hora_fim) {
    mostrarAlerta('alertaModalDisp', 'Preencha início e fim.', 'erro');
    return;
  }

  if (hora_inicio >= hora_fim) {
    mostrarAlerta('alertaModalDisp', 'Hora de início deve ser menor que hora de fim.', 'erro');
    return;
  }

  const btn = document.getElementById('btnSalvarDisp');
  btn.dataset.originalText = 'Adicionar';
  setButtonLoading('btnSalvarDisp', true);

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

    fecharModal('modalDisponibilidade', 'formDisponibilidade');
    carregarDisponibilidades();
  } catch {
    mostrarAlerta('alertaModalDisp', 'Não foi possível conectar ao servidor.', 'erro');
  } finally {
    setButtonLoading('btnSalvarDisp', false);
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

carregarProfissionais();
