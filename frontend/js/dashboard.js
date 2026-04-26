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
    document.getElementById('viewAgendamentos').classList.toggle('d-none', view !== 'agendamentos');
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

// ── Modal ───────────────────────────────────────────────
function abrirModal(titulo = 'Novo Profissional') {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalOverlay').classList.remove('d-none');
  ocultarAlerta('alertaModal');
}

function fecharModal() {
  document.getElementById('modalOverlay').classList.add('d-none');
  document.getElementById('formProfissional').reset();
  document.getElementById('profissionalId').value = '';
}

function abrirEdicao(id, nome, especialidade) {
  document.getElementById('profissionalId').value = id;
  document.getElementById('nomeProfissional').value = nome;
  document.getElementById('especialidade').value = especialidade;
  abrirModal('Editar Profissional');
}

document.getElementById('btnCriarProfissional').addEventListener('click', () => abrirModal());
document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) fecharModal();
});

document.getElementById('formProfissional').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta('alertaModal');

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
      mostrarAlerta('alertaModal', data.erro || 'Erro ao salvar.');
      return;
    }

    fecharModal();
    carregarProfissionais();
  } catch {
    mostrarAlerta('alertaModal', 'Não foi possível conectar ao servidor.');
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

// ── Agendamentos ────────────────────────────────────────
async function carregarAgendamentos() {
  // implementado quando a rota /agendamentos estiver pronta
}

// ── Init ────────────────────────────────────────────────
carregarProfissionais();
