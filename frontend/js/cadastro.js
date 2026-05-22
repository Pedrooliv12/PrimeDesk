const API = 'http://localhost:3000';

const form = document.getElementById('formCadastro');
const alerta = document.getElementById('alerta');
const btnSubmit = document.getElementById('btnSubmit');
const toggleSenha = document.getElementById('toggleSenha');
const inputSenha = document.getElementById('senha_empresa');
const selectPergunta = document.getElementById('pergunta_seguranca');

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

async function carregarPerguntas() {
  try {
    const res = await fetch(`${API}/auth/perguntas`);
    const data = await res.json();
    for (const { chave, pergunta } of data.perguntas) {
      const opt = document.createElement('option');
      opt.value = chave;
      opt.textContent = pergunta;
      selectPergunta.appendChild(opt);
    }
  } catch {
    mostrarAlerta('Não foi possível carregar perguntas de segurança.');
  }
}

carregarPerguntas();

document.getElementById('nome_empresa').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta();

  const nome_empresa = document.getElementById('nome_empresa').value.trim();

  if (!/^[a-zA-Z0-9 ]+$/.test(nome_empresa)) {
    mostrarAlerta('O nome da empresa só pode conter letras, números e espaços.');
    return;
  }
  const email_empresa = document.getElementById('email_empresa').value.trim().toLowerCase();
  const senha_empresa = inputSenha.value;
  const pergunta_seguranca = selectPergunta.value;
  const resposta_seguranca = document.getElementById('resposta_seguranca').value.trim();

  if (!pergunta_seguranca) {
    mostrarAlerta('Selecione uma pergunta de segurança.');
    return;
  }
  if (resposta_seguranca.length < 2) {
    mostrarAlerta('A resposta de segurança deve ter pelo menos 2 caracteres.');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Criando conta...';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_empresa,
        email_empresa,
        senha_empresa,
        pergunta_seguranca,
        resposta_seguranca,
      }),
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
