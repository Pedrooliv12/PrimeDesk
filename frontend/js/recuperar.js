const API = 'http://localhost:3000';

const formEmail = document.getElementById('formEmail');
const formRedefinir = document.getElementById('formRedefinir');
const alertaEmail = document.getElementById('alertaEmail');
const alertaRedefinir = document.getElementById('alertaRedefinir');
const btnEmail = document.getElementById('btnEmail');
const btnRedefinir = document.getElementById('btnRedefinir');
const perguntaTexto = document.getElementById('perguntaTexto');
const inputNovaSenha = document.getElementById('nova_senha');

let emailEmpresa = '';

document.getElementById('toggleSenha').addEventListener('click', () => {
  inputNovaSenha.type = inputNovaSenha.type === 'text' ? 'password' : 'text';
});

function mostrarAlerta(el, mensagem, tipo = 'erro') {
  el.textContent = mensagem;
  el.className = `alerta alerta-${tipo}`;
}

function ocultar(el) { el.className = 'alerta d-none'; }

formEmail.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultar(alertaEmail);

  const email = document.getElementById('email_empresa').value.trim().toLowerCase();
  if (!email) return;

  btnEmail.disabled = true;
  btnEmail.textContent = 'Buscando...';

  try {
    const res = await fetch(`${API}/auth/recuperar/pergunta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_empresa: email }),
    });

    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta(alertaEmail, data.erro || 'Erro ao buscar conta.');
      return;
    }

    emailEmpresa = email;
    perguntaTexto.textContent = data.pergunta;
    formEmail.classList.add('d-none');
    formRedefinir.classList.remove('d-none');
  } catch {
    mostrarAlerta(alertaEmail, 'Não foi possível conectar ao servidor.');
  } finally {
    btnEmail.disabled = false;
    btnEmail.textContent = 'Continuar';
  }
});

formRedefinir.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultar(alertaRedefinir);

  const resposta_seguranca = document.getElementById('resposta_seguranca').value.trim();
  const nova_senha = inputNovaSenha.value;

  if (resposta_seguranca.length < 2) {
    mostrarAlerta(alertaRedefinir, 'Informe sua resposta.');
    return;
  }
  if (nova_senha.length < 6) {
    mostrarAlerta(alertaRedefinir, 'A nova senha deve ter pelo menos 6 caracteres.');
    return;
  }

  btnRedefinir.disabled = true;
  btnRedefinir.textContent = 'Redefinindo...';

  try {
    const res = await fetch(`${API}/auth/recuperar/redefinir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_empresa: emailEmpresa,
        resposta_seguranca,
        nova_senha,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta(alertaRedefinir, data.erro || 'Erro ao redefinir senha.');
      return;
    }

    mostrarAlerta(alertaRedefinir, 'Senha redefinida! Redirecionando...', 'sucesso');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  } catch {
    mostrarAlerta(alertaRedefinir, 'Não foi possível conectar ao servidor.');
  } finally {
    btnRedefinir.disabled = false;
    btnRedefinir.textContent = 'Redefinir senha';
  }
});
