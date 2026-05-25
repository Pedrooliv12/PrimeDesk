const token = localStorage.getItem('token');
const empresa = JSON.parse(localStorage.getItem('empresa') || 'null');

if (!token || !empresa) {
  window.location.href = 'login.html';
}

const statusBadge = document.getElementById('statusBadge');
const statusTexto = document.getElementById('statusTexto');
const precoValor = document.getElementById('precoValor');
const btnAssinar = document.getElementById('btnAssinar');
const linkVoltar = document.getElementById('linkVoltar');
const alertaEl = document.getElementById('alerta');

document.getElementById('btnSair').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('empresa');
  window.location.href = 'login.html';
});

function mostrarAlerta(mensagem, tipo = 'erro') {
  alertaEl.textContent = mensagem;
  alertaEl.className = `alerta alerta-${tipo}`;
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function aplicarStatus(status) {
  statusBadge.classList.remove('status-trial', 'status-expirada', 'status-ativa');

  if (status.tipo === 'trial') {
    statusBadge.classList.add('status-trial');
    statusTexto.textContent = `Período de teste — ${status.dias_restantes} dia(s) restantes`;
    btnAssinar.innerHTML = '<i class="bi bi-credit-card"></i> Assinar agora';
    linkVoltar.classList.remove('d-none');
  } else if (status.tipo === 'assinatura') {
    statusBadge.classList.add('status-ativa');
    statusTexto.textContent = `Assinatura ativa — renova em ${status.dias_restantes} dia(s)`;
    btnAssinar.innerHTML = '<i class="bi bi-arrow-repeat"></i> Renovar por mais 30 dias';
    linkVoltar.classList.remove('d-none');
  } else {
    statusBadge.classList.add('status-expirada');
    statusTexto.textContent = 'Assinatura expirada';
    btnAssinar.innerHTML = '<i class="bi bi-credit-card"></i> Reativar acesso';
    linkVoltar.classList.add('d-none');
  }
}

async function carregarStatus() {
  try {
    const res = await fetch('/assinatura/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();
    precoValor.textContent = `R$ ${formatarPreco(data.preco_mensal)}`;
    aplicarStatus(data);
  } catch {
    mostrarAlerta('Não foi possível carregar o status da assinatura.');
  }
}

btnAssinar.addEventListener('click', async () => {
  btnAssinar.disabled = true;
  const textoOriginal = btnAssinar.innerHTML;
  btnAssinar.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';

  try {
    const res = await fetch('/assinatura/assinar', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      mostrarAlerta(data.erro || 'Falha ao processar a assinatura.');
      btnAssinar.disabled = false;
      btnAssinar.innerHTML = textoOriginal;
      return;
    }

    const data = await res.json();
    mostrarAlerta(`Assinatura confirmada! Cobrado R$ ${formatarPreco(data.valor_cobrado)}.`, 'sucesso');
    await carregarStatus();
    btnAssinar.disabled = false;
  } catch {
    mostrarAlerta('Erro de conexão. Tente novamente.');
    btnAssinar.disabled = false;
    btnAssinar.innerHTML = textoOriginal;
  }
});

carregarStatus();
