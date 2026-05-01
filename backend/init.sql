-- PrimeDesk - Inicialização do Banco de Dados
-- Execute este arquivo para criar as tabelas necessárias

CREATE TABLE IF NOT EXISTS "empresas" (
  "id" SERIAL PRIMARY KEY,
  "nome_empresa" varchar(150),
  "email_empresa" varchar(255) UNIQUE,
  "senha_empresa" varchar(255)
);

CREATE TABLE IF NOT EXISTS "profissionais" (
  "id" SERIAL PRIMARY KEY,
  "id_empresa" integer REFERENCES "empresas" ("id") ON DELETE CASCADE,
  "nome_profissional" varchar(100),
  "especialidade" varchar(100)
);

CREATE TABLE IF NOT EXISTS "horarios_disponiveis" (
  "id" SERIAL PRIMARY KEY,
  "id_profissional" integer REFERENCES "profissionais" ("id") ON DELETE CASCADE,
  "data_hora_inicio" timestamp NOT NULL,
  "status" varchar(20) DEFAULT 'disponivel'
);
