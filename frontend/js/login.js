const API = 'http://localhost:3000';

const form = document.getElementById('formLogin');
const alerta = document.getElementById('alerta');
const btnSubmit = document.getElementById('btnSubmit');
const inputSenha = document.getElementById('senha_empresa');

document.getElementById('toggleSenha').addEventListener('click', () => {
  inputSenha.type = inputSenha.type === 'text' ? 'password' : 'text';
});

function mostrarAlerta(mensagem, tipo = 'erro') {
  alerta.textContent = mensagem;
  alerta.className = `alerta alerta-${tipo}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alerta.className = 'alerta d-none';

  const email_empresa = document.getElementById('email_empresa').value.trim().toLowerCase();
  const senha_empresa = inputSenha.value;

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Entrando...';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_empresa, senha_empresa }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.erro || 'Email ou senha incorretos.');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('empresa', JSON.stringify(data.empresa));

    mostrarAlerta('Login realizado! Redirecionando...', 'sucesso');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);

  } catch {
    mostrarAlerta('Não foi possível conectar ao servidor.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Entrar';
  }
});
