# PrimeDesk

> SaaS de agendamento estilo Calendly. Empresas cadastram profissionais, definem horários disponíveis e compartilham um link público onde clientes marcam horários sem precisar de cadastro.

> 🎓 **Projeto acadêmico** desenvolvido como trabalho de faculdade no CESMAC para o 3º período.

![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-Academic-blue)

---

## ✨ Funcionalidades

- 🏢 **Cadastro e login de empresas** com JWT e bcrypt
- 🔑 **Recuperação de senha** via pergunta de segurança
- 👥 **Gerenciamento de profissionais** (CRUD)
- 🗓️ **Disponibilidades semanais recorrentes** por profissional
- 🔗 **Página pública de agendamento** acessível por slug único
- 🔔 **Notificações** de novos agendamentos com badge
- 📋 **Histórico de agendamentos** no dashboard

---

## 🚀 Quickstart (Docker — recomendado)

A forma mais rápida de subir o projeto. Você precisa apenas de [Docker](https://www.docker.com/) instalado.

### 1. Clone o repositório

```bash
git clone https://github.com/Pedrooliv12/PrimeDesk.git
cd PrimeDesk
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` na raiz e defina pelo menos:

```env
DB_PASSWORD=uma_senha_qualquer
JWT_SECRET=qualquer_coisa_aqui_(ex.:teste)
```

### 3. Suba os containers

```bash
docker compose up -d
```

Isso inicia:
- **db**: PostgreSQL 16 com o schema(`init.sql`) já aplicado
- **backend**: Node.js servindo a API e o frontend estático na porta `3000`

### 4. Acesse a aplicação

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Comandos úteis

```bash
docker compose logs -f backend   # Acompanhar logs do backend
docker compose down              # Parar e remover containers
docker compose down -v           # Parar e apagar dados do banco
docker compose up -d --build     # Rebuild após mudar dependências
```

---

## 🛠️ Setup local (sem Docker)

Use caso queira rodar o Node fora de container. Requer **PostgreSQL local** já instalado.

### 1. Criar o banco

```powershell
createdb -U postgres primedesk
psql -U postgres -d primedesk -f backend/init.sql
```

### 2. Variáveis de ambiente

```powershell
cp .env.example backend/.env
```

Ajuste `backend/.env` apontando para o Postgres local:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=primedesk
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=qualquer_coisa_aqui_(ex.:teste)
```

### 3. Instalar e rodar o backend

```powershell
cd backend
npm install
npm run dev
```

### 4. Abrir o frontend

O backend já serve os arquivos estáticos em `http://localhost:3000`.

---

## 📦 Stack

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Backend      | Node.js 20 + Express 4              |
| Banco        | PostgreSQL 16 (pool `pg`)           |
| Auth         | JWT + bcrypt                        |
| Frontend     | HTML, CSS, JS puro + Bootstrap 5    |
| Infra        | Docker + Docker Compose             |

---

## 📁 Estrutura

```
PrimeDesk/
├── backend/
│   ├── src/
│   │   ├── app.js                # Configuração do Express
│   │   ├── db/index.js           # Pool PostgreSQL
│   │   ├── middlewares/auth.js   # Verificação de JWT
│   │   ├── controllers/          # Lógica de negócio
│   │   └── routes/               # Definição de rotas
│   ├── server.js                 # Entry point
│   ├── init.sql                  # Schema do banco
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html                # Landing page
│   ├── cadastro.html             # Cadastro de empresa
│   ├── login.html                # Login
│   ├── recuperar.html            # Recuperação de senha
│   ├── dashboard.html            # Dashboard (área logada)
│   ├── agenda.html               # Página pública de agendamento
│   ├── css/
│   └── js/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API

### Autenticação

| Método | Rota                          | Descrição                                  | Auth |
|--------|-------------------------------|--------------------------------------------|------|
| POST   | `/auth/register`              | Cadastrar nova empresa                     | ❌   |
| POST   | `/auth/login`                 | Login (retorna JWT)                        | ❌   |
| GET    | `/auth/perguntas`             | Lista perguntas de segurança disponíveis   | ❌   |
| POST   | `/auth/recuperar/pergunta`    | Obtém a pergunta cadastrada por e-mail     | ❌   |
| POST   | `/auth/recuperar/redefinir`   | Valida resposta e redefine a senha         | ❌   |

### Profissionais

| Método | Rota                  | Descrição                | Auth |
|--------|-----------------------|--------------------------|------|
| GET    | `/profissionais`      | Listar profissionais     | ✅   |
| POST   | `/profissionais`      | Criar profissional       | ✅   |
| PUT    | `/profissionais/:id`  | Editar profissional      | ✅   |
| DELETE | `/profissionais/:id`  | Excluir profissional     | ✅   |

### Disponibilidades semanais

| Método | Rota                      | Descrição                                            | Auth |
|--------|---------------------------|------------------------------------------------------|------|
| GET    | `/disponibilidades`       | Listar (filtro opcional `?id_profissional=X`)        | ✅   |
| POST   | `/disponibilidades`       | Criar slot semanal recorrente                        | ✅   |
| DELETE | `/disponibilidades/:id`   | Excluir slot                                         | ✅   |

### Horários específicos

| Método | Rota              | Descrição                       | Auth |
|--------|-------------------|---------------------------------|------|
| GET    | `/horarios`       | Listar instâncias de horário    | ✅   |
| POST   | `/horarios`       | Criar horário específico        | ✅   |
| DELETE | `/horarios/:id`   | Excluir horário                 | ✅   |

### Agenda pública e agendamentos

| Método | Rota                         | Descrição                                  | Auth |
|--------|------------------------------|--------------------------------------------|------|
| GET    | `/agenda/:slug`              | Listar horários disponíveis da empresa     | ❌   |
| POST   | `/agendamentos`              | Criar agendamento                          | ❌   |
| GET    | `/agendamentos`              | Listar agendamentos da empresa             | ✅   |
| PATCH  | `/agendamentos/:id/lido`     | Marcar agendamento como lido               | ✅   |

> Rotas autenticadas exigem header `Authorization: Bearer <token>`.

---

## 🔒 Segurança

- Senhas e respostas de pergunta de segurança armazenadas com hash `bcrypt`
- Autenticação via JWT (expira em 1 dia)
- Rotas autenticadas filtram por `id_empresa` para isolar dados entre contas
- Validação de tamanho e formato em todos os inputs textuais

---

## 🧪 Fluxo de uso

### Empresa
1. Cadastra-se na landing page (nome, e-mail, senha, pergunta de segurança)
2. Faz login e acessa o dashboard
3. Cadastra profissionais e define horários disponíveis
4. Compartilha o link público (`/agenda.html?slug=sua-empresa`) com clientes
5. Acompanha agendamentos e notificações no dashboard

### Cliente (sem cadastro)
1. Acessa o link público da empresa
2. Escolhe um horário disponível
3. Preenche nome e WhatsApp
4. Confirma o agendamento

### Recuperação de senha
1. Na tela de login, clica em **"Esqueceu a senha?"**
2. Informa o e-mail da conta
3. Responde a pergunta de segurança cadastrada
4. Define uma nova senha

---

## 📝 Notas

- Se a porta `3000` estiver ocupada, mude `PORT` no `.env` (ou ajuste o mapeamento no `docker-compose.yml`)
- O Docker Compose já aplica o `init.sql` automaticamente no primeiro start; recriar o banco requer `docker compose down -v`

---

## 👨‍💻 CESMAC — 2026
