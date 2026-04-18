# PrimeDesk - Sistema de Agendamento

Plataforma completa para gerenciamento de agendamentos com cadastro, login e dashboard de empresas.

## 📋 Pré-requisitos

- Node.js (v20+)
- PostgreSQL (rodando localmente)
- npm

## ⚙️ Configuração

### 1. Criar o Banco de Dados

No terminal (PowerShell ou CMD):

```powershell
# Cria a database
createdb -U postgres primedesk

# Executa o script de inicialização
psql -U postgres -d primedesk -f backend/init.sql
```

Se der erro de permissão, ajuste o usuário:
```powershell
createdb -U seu_usuario primedesk
psql -U seu_usuario -d primedesk -f backend/init.sql
```

### 2. Configurar Backend

No PowerShell, abra a pasta `backend`:

```powershell
cd backend
npm install
```

Verifique o arquivo `.env`:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=primedesk
```

Ajuste as credenciais se necessário.

### 3. Iniciar o Backend

```powershell
npm run dev
```

Você deve ver:
```
◇ injected env (6) from .env
Servidor rodando na porta 3000
```

### 4. Abrir o Frontend

Abra a pasta `frontend` em um navegador ou use Live Server no VS Code.

---

## 🚀 Como Usar

### Registro
1. Acesse `http://localhost/frontend/index.html` ou abra a pasta
2. Clique em **"Começar Agora"**
3. Insira email → nome da empresa → senha (mín. 8 caracteres)
4. Clique em **"Criar Conta"**
5. Será redirecionado ao dashboard

### Login
1. Clique em **"Entrar"** na landing page
2. Insira email e senha cadastrados
3. Clique em **"Entrar"**
4. Acesso ao dashboard

---

## 📁 Estrutura do Projeto

```
PrimeDesk/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── companyController.js
│   │   └── routes/
│   │       ├── authRoutes.js
│   │       └── companyRoutes.js
│   ├── .env
│   ├── init.sql
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── pages/
    │   ├── landingpage.html
    │   ├── registro.html
    │   ├── registro-detalhes.html
    │   ├── login.html
    │   └── dashboard.html
    ├── assets/
    │   ├── css/
    │   └── img/
```

---

## 🔌 API Endpoints

### Autenticação
- **POST** `/api/auth/register` - Registrar nova empresa
- **POST** `/api/auth/login` - Fazer login

### Empresas
- **GET** `/api/empresas` - Listar todas as empresas
- **POST** `/api/empresas` - Criar nova empresa

---

## 🔒 Segurança

- Senhas são armazenadas com hash `bcryptjs`
- Dados da empresa são salvos em `localStorage` após login
- CORS habilitado para requisições do frontend

---

## 📝 Notas

- O backend está configurado para `localhost:3000`
- Se a porta estiver ocupada, mude em `backend/.env` → `PORT=3001`
- Certifique-se de que PostgreSQL está rodando antes de iniciar o backend

---

## 👨‍💻 CESMAC - 2026