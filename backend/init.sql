-- PrimeDesk - Inicialização do Banco de Dados
-- Execute este arquivo para criar as tabelas necessárias

CREATE TABLE IF NOT EXISTS "empresas" (
  "id" SERIAL PRIMARY KEY,
  "nome_empresa" varchar(150),
  "email_empresa" varchar(255) UNIQUE,
  "senha_empresa" varchar(255),
  "slug" varchar(100) UNIQUE,
  "pergunta_seguranca" varchar(50),
  "resposta_seguranca" varchar(255)
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
  "status" varchar(20) DEFAULT 'disponivel',
  UNIQUE ("id_profissional", "data_hora_inicio")
);

CREATE TABLE IF NOT EXISTS "disponibilidades_horarias" (
  "id" SERIAL PRIMARY KEY,
  "id_profissional" integer REFERENCES "profissionais" ("id") ON DELETE CASCADE,
  "dia_semana" integer NOT NULL CHECK ("dia_semana" BETWEEN 0 AND 6),
  "hora_inicio" time NOT NULL,
  "hora_fim" time NOT NULL,
  CHECK ("hora_inicio" < "hora_fim")
);

CREATE TABLE IF NOT EXISTS "agendamentos" (
  "id" SERIAL PRIMARY KEY,
  "id_horario" integer REFERENCES "horarios_disponiveis" ("id") ON DELETE CASCADE,
  "nome_cliente" varchar(100),
  "cliente_whatsapp" varchar(15),
  "confirmado" boolean DEFAULT false,
  "lido" boolean DEFAULT false,
  "criado_em" timestamp DEFAULT CURRENT_TIMESTAMP
);
