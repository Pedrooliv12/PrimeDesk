const params = new URLSearchParams(window.location.search);
const empresaSlug = params.get('empresa');

const elLoading = document.getElementById('loading');
const elErro = document.getElementById('erro');
const elConteudo = document.getElementById('conteudo');
const elNomeEmpresa = document.getElementById('nomeEmpresa');
const elListaProfissionais = document.getElementById('listaProfissionais');
const elModalOverlay = document.getElementById('modalOverlay');
const elModalResumo = document.getElementById('modalResumo');
const elModalAlerta = document.getElementById('modalAlerta');
const elNomeCliente = document.getElementById('nomeCliente');
const elWhatsappCliente = document.getElementById('whatsappCliente');
const elBtnConfirmar = document.getElementById('btnConfirmar');
const elBtnCancelar = document.getElementById('btnCancelar');

// { id_horario, resumo }
let slotSelecionado = null;
let slotTrigger = null;

if (!empresaSlug) {
  mostrarErro();
} else {
  carregarAgenda();
}

async function carregarAgenda() {
  try {
    const res = await fetch(`/agenda/${empresaSlug}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    elNomeEmpresa.textContent = data.empresa;
    renderizarProfissionais(data.profissionais);

    elLoading.classList.add('d-none');
    elConteudo.classList.remove('d-none');
  } catch {
    mostrarErro();
  }
}

function renderizarProfissionais(profissionais) {
  if (profissionais.length === 0) {
    elListaProfissionais.innerHTML = '<p class="text-muted">Nenhum profissional cadastrado.</p>';
    return;
  }

  elListaProfissionais.innerHTML = profissionais.map(p => {
    const inicial = p.nome.charAt(0).toUpperCase();
    const slotsHtml = renderizarSlots(p);
    return `
      <div class="profissional-card">
        <div class="profissional-header">
          <div class="profissional-avatar">${inicial}</div>
          <div>
            <div class="profissional-nome">${escapeHtml(p.nome)}</div>
            <div class="profissional-especialidade">${escapeHtml(p.especialidade || '')}</div>
          </div>
        </div>
        ${slotsHtml}
      </div>
    `;
  }).join('');

  elListaProfissionais.querySelectorAll('.slot-btn').forEach(btn => {
    btn.addEventListener('click', () => abrirModal(btn));
  });
}

function renderizarSlots(profissional) {
  if (!profissional.slots_disponiveis || profissional.slots_disponiveis.length === 0) {
    return '<p class="sem-slots">Nenhum horário disponível nos próximos dias.</p>';
  }

  // Agrupa slots por data
  const grupos = {};
  for (const slot of profissional.slots_disponiveis) {
    const data = new Date(slot.data_hora);
    const chaveData = data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!grupos[chaveData]) grupos[chaveData] = [];
    grupos[chaveData].push({
      id_horario: slot.id_horario,
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dataFormatada: chaveData,
    });
  }

  const gruposHtml = Object.entries(grupos).map(([data, slots]) => `
    <div class="slots-grupo">
      <div class="slots-data">${data}</div>
      <div class="slots-lista">
        ${slots.map(s => `
          <button
            class="slot-btn"
            data-id-horario="${s.id_horario}"
            data-profissional="${escapeHtml(profissional.nome)}"
            data-hora="${s.hora}"
            data-data="${s.dataFormatada}"
            aria-label="Agendar com ${escapeHtml(profissional.nome)}, ${s.dataFormatada} às ${s.hora}"
          >${s.hora}</button>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `<div class="slots-titulo">Horários disponíveis</div>${gruposHtml}`;
}

function abrirModal(btn) {
  slotSelecionado = {
    id_horario: parseInt(btn.dataset.idHorario),
    resumo: `${btn.dataset.profissional} — ${btn.dataset.data} às ${btn.dataset.hora}`,
  };
  slotTrigger = btn;

  elModalResumo.textContent = slotSelecionado.resumo;
  elNomeCliente.value = '';
  elWhatsappCliente.value = '';
  esconderAlerta();
  elBtnConfirmar.disabled = false;
  elBtnConfirmar.textContent = 'Confirmar';

  elModalOverlay.classList.remove('d-none');
  elNomeCliente.focus();
}

function fecharModal() {
  elModalOverlay.classList.add('d-none');
  slotSelecionado = null;
  if (slotTrigger) { slotTrigger.focus(); slotTrigger = null; }
}

elWhatsappCliente.addEventListener('input', () => {
  let v = elWhatsappCliente.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6) {
    elWhatsappCliente.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 2) {
    elWhatsappCliente.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else if (v.length > 0) {
    elWhatsappCliente.value = `(${v}`;
  } else {
    elWhatsappCliente.value = '';
  }
});

elBtnCancelar.addEventListener('click', fecharModal);

elModalOverlay.addEventListener('click', (e) => {
  if (e.target === elModalOverlay) fecharModal();
});

document.addEventListener('keydown', (e) => {
  if (elModalOverlay.classList.contains('d-none')) return;

  if (e.key === 'Escape') {
    fecharModal();
    return;
  }

  if (e.key === 'Tab') {
    const focusable = [...elModalOverlay.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )];
    if (!focusable.length) return;
    const primeiro = focusable[0];
    const ultimo = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    } else {
      if (document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  }
});

elBtnConfirmar.addEventListener('click', async () => {
  const nome = elNomeCliente.value.trim();
  const whatsapp = elWhatsappCliente.value.trim();

  if (!nome || !whatsapp) {
    mostrarAlerta('Preencha todos os campos.', 'erro');
    return;
  }

  const whatsappLimpo = whatsapp.replace(/\D/g, '');
  if (!/^[1-9]{2}9\d{8}$/.test(whatsappLimpo)) {
    mostrarAlerta('WhatsApp inválido. Use o formato (11) 99999-9999.', 'erro');
    return;
  }

  elBtnConfirmar.disabled = true;
  elBtnConfirmar.textContent = 'Confirmando...';

  try {
    const res = await fetch('/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_horario: slotSelecionado.id_horario,
        nome_cliente: nome,
        cliente_whatsapp: whatsapp,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.erro || 'Erro ao agendar. Tente novamente.', 'erro');
      elBtnConfirmar.disabled = false;
      elBtnConfirmar.textContent = 'Confirmar';
      return;
    }

    mostrarAlerta('Agendamento confirmado!', 'sucesso');

    setTimeout(() => {
      fecharModal();
      carregarAgenda();
    }, 1800);

  } catch {
    mostrarAlerta('Erro de conexão. Tente novamente.', 'erro');
    elBtnConfirmar.disabled = false;
    elBtnConfirmar.textContent = 'Confirmar';
  }
});

function mostrarAlerta(msg, tipo) {
  elModalAlerta.textContent = msg;
  elModalAlerta.className = `alerta alerta-${tipo}`;
}

function esconderAlerta() {
  elModalAlerta.className = 'alerta d-none';
}

function mostrarErro() {
  elLoading.classList.add('d-none');
  elErro.classList.remove('d-none');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
