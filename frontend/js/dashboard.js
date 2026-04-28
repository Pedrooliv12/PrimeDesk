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
    document.getElementById('viewAgendamentos').classList.toggle('d-none', view !== 'agendamentos');
    if (view === 'horarios') carregarHorarios();
    if (view === 'agendamentos') carregarAgendamentos();
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

// ── Horários ──────────────────────────────────────────
async function carregarHorarios() {
  try {
    const res = await fetch(`${API}/horarios`, { headers: authHeader() });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    renderHorarios(data.horarios || []);
  } catch {
    mostrarAlerta('alertaHorario', 'Não foi possível carregar os horários.');
  }
}

function renderHorarios(lista) {
  const grid = document.getElementById('listaHorarios');
  const empty = document.getElementById('emptyHorarios');

  if (!lista.length) {
    grid.innerHTML = '';
    empty.classList.remove('d-none');
    return;
  }

  empty.classList.add('d-none');
  grid.innerHTML = lista.map(h => `
    <div class="horario-card">
      <div class="horario-header">
        <span class="badge-status">${h.status}</span>
      </div>
      <div class="horario-info">
        <h5>${h.nome_profissional}</h5>
        <p class="horario-data">${new Date(h.data_hora_inicio).toLocaleString('pt-BR')}</p>
      </div>
      <div class="horario-actions">
        <button class="btn-icon btn-icon-danger" title="Excluir" onclick="excluirHorario(${h.id})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

async function excluirHorario(id) {
  if (!confirm('Excluir este horário?')) return;
  try {
    const res = await fetch(`${API}/horarios/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    if (res.ok) carregarHorarios();
    else mostrarAlerta('alertaHorario', 'Erro ao excluir horário.');
  } catch {
    mostrarAlerta('alertaHorario', 'Não foi possível conectar ao servidor.');
  }
}

async function abrirModalHorario() {
  document.getElementById('modalHorario').classList.remove('d-none');
  ocultarAlerta('alertaModalHorario');
  await preencherSelectProfissionais();
}

function fecharModalHorario() {
  document.getElementById('modalHorario').classList.add('d-none');
  document.getElementById('formHorario').reset();
}

async function preencherSelectProfissionais() {
  const select = document.getElementById('profissionalSelect');
  select.innerHTML = '<option value="">Selecione um profissional</option>';

  const res = await fetch(`${API}/profissionais`, { headers: authHeader() });
  const data = await res.json();
  const profissionais = data.profissionais || [];

  if (profissionais.length === 0) {
    mostrarAlerta('alertaModalHorario', 'Cadastre profissionais primeiro.', 'erro');
    return;
  }

  profissionais.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.nome_profissional;
    select.appendChild(option);
  });
}

document.getElementById('btnCriarHorario').addEventListener('click', abrirModalHorario);
document.getElementById('modalCloseHorario').addEventListener('click', fecharModalHorario);
document.getElementById('modalHorario').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalHorario')) fecharModalHorario();
});

document.getElementById('formHorario').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta('alertaModalHorario');

  const id_profissional = document.getElementById('profissionalSelect').value;
  const dataLocal = document.getElementById('dataHoraInicio').value;
  const btn = document.getElementById('btnSalvarHorario');

  if (!id_profissional) {
    mostrarAlerta('alertaModalHorario', 'Selecione um profissional.', 'erro');
    return;
  }

  const data_hora_inicio = new Date(dataLocal).toISOString();

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const res = await fetch(`${API}/horarios`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ id_profissional: parseInt(id_profissional), data_hora_inicio }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta('alertaModalHorario', data.erro || 'Erro ao salvar.', 'erro');
      return;
    }

    fecharModalHorario();
    carregarHorarios();
  } catch {
    mostrarAlerta('alertaModalHorario', 'Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

// ── Agendamentos ────────────────────────────────────────
async function carregarAgendamentos() {
  // implementado quando a rota /agendamentos estiver pronta
}

// ── Init ────────────────────────────────────────────────
carregarProfissionais();
carregarHorarios();
