const API = 'http://localhost:3000';

const form = document.getElementById('formCadastro');
const alerta = document.getElementById('alerta');
const btnSubmit = document.getElementById('btnSubmit');
const toggleSenha = document.getElementById('toggleSenha');
const inputSenha = document.getElementById('senha_empresa');

toggleSenha.addEventListener('click', () => {
  const visivel = inputSenha.type === 'text';
  inputSenha.type = visivel ? 'password' : 'text';
});

function mostrarAlerta(mensagem, tipo = 'erro') {
  alerta.textContent = mensagem;
  alerta.className = `alerta alerta-${tipo}`;
}

function ocultarAlerta() {
  alerta.className = 'alerta d-none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta();

  const nome_empresa = document.getElementById('nome_empresa').value.trim();
  const email_empresa = document.getElementById('email_empresa').value.trim().toLowerCase();
  const senha_empresa = inputSenha.value;

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Criando conta...';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_empresa, email_empresa, senha_empresa }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.erro || 'Erro ao criar conta.');
      return;
    }

    mostrarAlerta('Conta criada com sucesso!', 'sucesso');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);

  } catch {
    mostrarAlerta('Não foi possível conectar ao servidor.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Criar minha conta';
  }
});
