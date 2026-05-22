const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const PERGUNTAS_SEGURANCA = {
  ano_fundacao: 'Em que ano a empresa foi fundada?',
  cidade_sede: 'Em qual cidade fica a sede da empresa?',
  primeiro_cliente: 'Qual o nome do primeiro cliente da empresa?',
  primeiro_funcionario: 'Qual o nome do primeiro funcionário contratado?',
  cnpj_final: 'Quais são os 4 últimos dígitos do CNPJ da empresa?',
};

function gerarSlug(nomeEmpresa) {
  const base = nomeEmpresa.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40);
  const sufixo = Math.random().toString(36).slice(2, 6);
  return `${base}-${sufixo}`;
}

function normalizarResposta(resposta) {
  return resposta.trim().toLowerCase();
}

async function cadastroEmpresa(req, res) {
  const { nome_empresa, senha_empresa, pergunta_seguranca, resposta_seguranca } = req.body;
  const email_empresa = req.body.email_empresa?.toLowerCase().trim();

  if (!nome_empresa || !email_empresa || !senha_empresa || !pergunta_seguranca || !resposta_seguranca) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  if (nome_empresa.length > 150) {
    return res.status(400).json({ erro: 'O nome da empresa deve ter no máximo 150 caracteres.' });
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(nome_empresa)) {
    return res.status(400).json({ erro: 'O nome da empresa só pode conter letras, números e espaços.' });
  }

  if (email_empresa.length > 255) {
    return res.status(400).json({ erro: 'O e-mail deve ter no máximo 255 caracteres.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_empresa)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  if (senha_empresa.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  if (senha_empresa.length > 72) {
    return res.status(400).json({ erro: 'A senha deve ter no máximo 72 caracteres.' });
  }

  if (!PERGUNTAS_SEGURANCA[pergunta_seguranca]) {
    return res.status(400).json({ erro: 'Pergunta de segurança inválida.' });
  }

  const respostaNormalizada = normalizarResposta(resposta_seguranca);
  if (respostaNormalizada.length < 2 || respostaNormalizada.length > 100) {
    return res.status(400).json({ erro: 'A resposta deve ter entre 2 e 100 caracteres.' });
  }

  const emailExistente = await pool.query(
    'SELECT id FROM empresas WHERE email_empresa = $1',
    [email_empresa]
  );
  if (emailExistente.rows.length > 0) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(senha_empresa, 10);
  const respostaHash = await bcrypt.hash(respostaNormalizada, 10);
  const slug = gerarSlug(nome_empresa);

  const empresaCadastrada = await pool.query(
    `INSERT INTO empresas (nome_empresa, email_empresa, senha_empresa, slug, pergunta_seguranca, resposta_seguranca)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nome_empresa, email_empresa, slug`,
    [nome_empresa, email_empresa, senhaHash, slug, pergunta_seguranca, respostaHash]
  );

  return res.status(201).json({ empresa: empresaCadastrada.rows[0] });
}

async function loginEmpresa(req, res) {
  const { senha_empresa } = req.body;
  const email_empresa = req.body.email_empresa?.toLowerCase().trim();

  if (!email_empresa || !senha_empresa) {
    return res.status(400).json({ erro: 'email_empresa e senha_empresa são obrigatórios.' });
  }

  const empresaBuscada = await pool.query(
    'SELECT id, nome_empresa, email_empresa, senha_empresa, slug FROM empresas WHERE email_empresa = $1',
    [email_empresa]
  );

  const empresa = empresaBuscada.rows[0];

  if (!empresa) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const senhaCorreta = await bcrypt.compare(senha_empresa, empresa.senha_empresa);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { id: empresa.id, nome_empresa: empresa.nome_empresa },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return res.json({
    token,
    empresa: {
      id: empresa.id,
      nome_empresa: empresa.nome_empresa,
      email_empresa: empresa.email_empresa,
      slug: empresa.slug,
    },
  });
}

function listarPerguntas(req, res) {
  const lista = Object.entries(PERGUNTAS_SEGURANCA).map(([chave, pergunta]) => ({ chave, pergunta }));
  return res.json({ perguntas: lista });
}

async function obterPerguntaSeguranca(req, res) {
  const email_empresa = req.body.email_empresa?.toLowerCase().trim();

  if (!email_empresa) {
    return res.status(400).json({ erro: 'E-mail é obrigatório.' });
  }

  const resultado = await pool.query(
    'SELECT pergunta_seguranca FROM empresas WHERE email_empresa = $1',
    [email_empresa]
  );

  const empresa = resultado.rows[0];
  if (!empresa || !empresa.pergunta_seguranca) {
    return res.status(404).json({ erro: 'E-mail não encontrado ou sem pergunta de segurança cadastrada.' });
  }

  return res.json({
    chave: empresa.pergunta_seguranca,
    pergunta: PERGUNTAS_SEGURANCA[empresa.pergunta_seguranca],
  });
}

async function redefinirSenha(req, res) {
  const { resposta_seguranca, nova_senha } = req.body;
  const email_empresa = req.body.email_empresa?.toLowerCase().trim();

  if (!email_empresa || !resposta_seguranca || !nova_senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  if (nova_senha.length < 6 || nova_senha.length > 72) {
    return res.status(400).json({ erro: 'A nova senha deve ter entre 6 e 72 caracteres.' });
  }

  const resultado = await pool.query(
    'SELECT id, resposta_seguranca FROM empresas WHERE email_empresa = $1',
    [email_empresa]
  );

  const empresa = resultado.rows[0];
  if (!empresa || !empresa.resposta_seguranca) {
    return res.status(404).json({ erro: 'E-mail não encontrado.' });
  }

  const respostaCorreta = await bcrypt.compare(
    normalizarResposta(resposta_seguranca),
    empresa.resposta_seguranca
  );

  if (!respostaCorreta) {
    return res.status(401).json({ erro: 'Resposta incorreta.' });
  }

  const novaSenhaHash = await bcrypt.hash(nova_senha, 10);
  await pool.query(
    'UPDATE empresas SET senha_empresa = $1 WHERE id = $2',
    [novaSenhaHash, empresa.id]
  );

  return res.json({ mensagem: 'Senha redefinida com sucesso.' });
}

module.exports = {
  cadastroEmpresa,
  loginEmpresa,
  listarPerguntas,
  obterPerguntaSeguranca,
  redefinirSenha,
};
