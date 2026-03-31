-- =============================================================
--  SGO – Script de inicialização da Base de Dados
--  Executa este ficheiro no MySQL Workbench (ou CLI) antes de
--  correr o backend pela primeira vez.
-- =============================================================

-- 1. Criar a base de dados (se ainda não existir)
CREATE DATABASE IF NOT EXISTS sgo_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Selecionar a base de dados
USE sgo_db;

-- 3. (Opcional) Criar um utilizador dedicado em vez de usar root
--    Descomenta e adapta as linhas abaixo se quiseres um utilizador próprio:
--
-- CREATE USER IF NOT EXISTS 'sgo_user'@'localhost' IDENTIFIED BY 'sgo_password';
-- GRANT ALL PRIVILEGES ON sgo_db.* TO 'sgo_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Nota: As tabelas são criadas automaticamente pelo Hibernate (ddl-auto=update)
--       quando o backend arranca pela primeira vez.
