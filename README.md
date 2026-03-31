# Sistema de Gestão de Oficina (SGO)

Sistema completo de gestão de oficina automóvel. Backend Jakarta Servlet + Hibernate (sem Spring Boot), deployável em Tomcat 10.1. Frontend web (HTML5 + CSS3 + JavaScript puro) integrado no WAR.

---

## Índice

1. [Descrição do Projeto](#descrição-do-projeto)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Pré-requisitos](#pré-requisitos)
5. [Configuração da Base de Dados](#configuração-da-base-de-dados)
6. [Build do Projeto](#build-do-projeto)
7. [Deploy no Tomcat](#deploy-no-tomcat)
8. [Variáveis de Ambiente](#variáveis-de-ambiente)
9. [Perfis de Utilizador](#perfis-de-utilizador)
10. [Funcionalidades Principais](#funcionalidades-principais)
11. [API REST](#api-rest)
12. [Segurança e Autenticação](#segurança-e-autenticação)
13. [Regras de Negócio](#regras-de-negócio)

---

## Descrição do Projeto

O **SGO** é uma aplicação web completa para gestão de uma oficina automóvel. Permite gerir clientes, viaturas, agendamentos, ordens de reparação, stock de peças e visualizar KPIs de desempenho.

O sistema suporta **três perfis de utilizador**:
- **Gerente (MANAGER)** – acesso total: dashboard de KPIs, relatórios, gestão de utilizadores e parametrizações.
- **Receção (RECEPTION)** – gestão de clientes, viaturas, agenda semanal e criação de ordens de reparação.
- **Mecânico (MECHANIC)** – painel de trabalho dedicado: ver reparações atribuídas, cronómetro, checklist de diagnóstico, requisição de peças e conclusão de trabalhos.

---

## Tecnologias Utilizadas

| Camada     | Tecnologia                                             |
|------------|--------------------------------------------------------|
| Backend    | Java 17, Jakarta Servlet 6.0 (Tomcat 10.1)            |
| ORM        | Hibernate 6.4 (JPA 3.0)                               |
| Pool       | HikariCP 5.1                                          |
| Segurança  | JWT (JJWT 0.11.5) + BCrypt (jBCrypt 0.4)              |
| Base Dados | MySQL 8                                               |
| Build      | Maven (empacota como WAR)                             |
| Frontend   | HTML5, CSS3 (Grid & Flexbox), JavaScript ES6+ puro    |

---

## Estrutura do Projeto

```
Programacao_web_Oficina/
├── database/
│   └── init.sql                    # Script SQL de inicialização da BD
├── backend/                        # Aplicação Jakarta Servlet (WAR)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/oficina/sgo/
│       │   ├── dao/                # DAOs com EntityManager (Hibernate)
│       │   ├── dto/                # Request/Response DTOs (Java records)
│       │   ├── exception/          # Exceções de negócio
│       │   ├── filter/             # CorsFilter, JwtFilter
│       │   ├── listener/           # AppContextListener (bootstrap)
│       │   ├── model/              # Entidades JPA
│       │   ├── security/           # JwtTokenProvider
│       │   ├── service/            # Lógica de negócio
│       │   ├── servlet/            # HttpServlets (API REST)
│       │   └── util/               # PasswordUtil
│       ├── resources/
│       │   └── META-INF/
│       │       └── persistence.xml # Configuração Hibernate/JPA
│       └── webapp/
│           ├── WEB-INF/
│           │   └── web.xml         # Configuração Servlet
│           ├── index.html          # Login
│           ├── dashboard.html
│           ├── agenda.html
│           ├── clientes.html
│           ├── viaturas.html
│           ├── reparacoes.html
│           ├── pecas.html
│           ├── mecanico.html
│           ├── css/styles.css
│           └── js/                 # JavaScript da aplicação
└── frontend/                       # Fonte dos ficheiros frontend
```

---

## Pré-requisitos

- **Java 17** ou superior ([Adoptium Temurin](https://adoptium.net/))
- **Maven 3.6+** ([download](https://maven.apache.org/download.cgi))
- **MySQL 8.0+** ([MySQL Community Server](https://dev.mysql.com/downloads/mysql/))
- **Apache Tomcat 10.1+** ([download](https://tomcat.apache.org/download-10.cgi))

> ⚠️ **Importante:** Use **Tomcat 10.1** (Jakarta EE 10). Tomcat 9.x usa a API `javax.*` que é incompatível.

---

## Configuração da Base de Dados

### 1. Criar a base de dados

No MySQL (Workbench ou linha de comando):

```sql
CREATE DATABASE IF NOT EXISTS sgo_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

Ou executa o script incluído:
```bash
mysql -u root -p < database/init.sql
```

### 2. Configurar credenciais

As credenciais são passadas via **variáveis de ambiente** (ver secção abaixo). Por omissão:

| Propriedade   | Valor padrão                                |
|---------------|---------------------------------------------|
| DB_URL        | `jdbc:mysql://localhost:3306/sgo_db?...`    |
| DB_USERNAME   | `root`                                      |
| DB_PASSWORD   | `password`                                  |

> As tabelas são criadas automaticamente pelo Hibernate na primeira execução (`hbm2ddl.auto=update`).

---

## Build do Projeto

```bash
cd backend

# Gerar o WAR
mvn clean package

# O WAR é gerado em:
# backend/target/sgo.war
```

---

## Deploy no Tomcat

### Opção A: Deploy automático (pasta webapps)

1. Copia `backend/target/sgo.war` para `TOMCAT_HOME/webapps/`
2. Arranca (ou reinicia) o Tomcat:
   ```bash
   # Linux/Mac
   $TOMCAT_HOME/bin/startup.sh

   # Windows
   %TOMCAT_HOME%\bin\startup.bat
   ```
3. Abre o browser: **http://localhost:8080/sgo/**

### Opção B: Deploy como ROOT (contexto raiz)

Para aceder diretamente em `http://localhost:8080/` sem o prefixo `/sgo`:

```bash
cp backend/target/sgo.war $TOMCAT_HOME/webapps/ROOT.war
```

### Variáveis de Ambiente no Tomcat

Para definir as variáveis de ambiente, edita `TOMCAT_HOME/bin/setenv.sh` (Linux/Mac) ou `setenv.bat` (Windows):

**setenv.sh:**
```bash
export DB_URL="jdbc:mysql://localhost:3306/sgo_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
export DB_USERNAME="root"
export DB_PASSWORD="a_tua_password"
export JWT_SECRET="uma-chave-secreta-longa-minimo-32-caracteres-aqui"
```

**setenv.bat:**
```bat
set DB_URL=jdbc:mysql://localhost:3306/sgo_db?useSSL=false^&serverTimezone=UTC^&allowPublicKeyRetrieval=true
set DB_USERNAME=root
set DB_PASSWORD=a_tua_password
set JWT_SECRET=uma-chave-secreta-longa-minimo-32-caracteres-aqui
```

---

## Variáveis de Ambiente

| Variável        | Descrição                                | Padrão (desenvolvimento)                     |
|-----------------|------------------------------------------|----------------------------------------------|
| `DB_URL`        | URL JDBC da base de dados                | `jdbc:mysql://localhost:3306/sgo_db?...`      |
| `DB_USERNAME`   | Utilizador MySQL                         | `root`                                       |
| `DB_PASSWORD`   | Password MySQL                           | `password`                                   |
| `JWT_SECRET`    | Chave secreta JWT (mín. 32 caracteres)   | valor padrão de dev (alterar em produção!)   |
| `JWT_EXPIRATION`| Expiração do token JWT (ms)              | `86400000` (24 horas)                        |

> ⚠️ **Segurança:** Altera SEMPRE `JWT_SECRET` e `DB_PASSWORD` em produção.

---

## Utilizador Inicial

Na primeira execução (sem utilizadores na BD), é criado automaticamente:

| Campo      | Valor        |
|------------|--------------|
| Username   | `admin`      |
| Password   | `admin123`   |
| Role       | `MANAGER`    |

> ⚠️ **Importante:** Altera a password imediatamente após o primeiro login em produção.

---

## Perfis de Utilizador

| Role        | Acesso                                                                 |
|-------------|------------------------------------------------------------------------|
| `MANAGER`   | Dashboard KPIs, gestão de utilizadores, relatórios, todas as páginas   |
| `RECEPTION` | Agenda, clientes, viaturas, reparações, peças                          |
| `MECHANIC`  | Painel do mecânico (apenas reparações atribuídas ao próprio)           |

---

## Funcionalidades Principais

### Dashboard (Gerente)
- KPIs: faturação diária/semanal/mensal
- Reparações em curso e concluídas hoje
- Ocupação da oficina: **X/8 viaturas**
- Alertas de stock baixo
- Gestão de utilizadores do sistema

### Agenda Semanal (Receção)
- Visualização tipo calendário (segunda a sábado, 8h–18h)
- Máximo de 3 reparações por slot horário
- Criar/editar/cancelar marcações

### Painel do Mecânico
- Lista de reparações atribuídas
- Cronómetro por operação
- Requisição de peças
- Conclusão de trabalho

### Gestão de Clientes, Viaturas, Stock de Peças
- CRUD completo com pesquisa
- Histórico de reparações

---

## API REST

Base URL: `http://localhost:8080/sgo/api`

| Recurso          | Endpoint                              | Métodos              |
|------------------|---------------------------------------|----------------------|
| Autenticação     | `/auth/login`                         | POST                 |
| Utilizadores     | `/users`                              | GET, POST, PUT, DELETE |
| Clientes         | `/clientes`                           | GET, POST, PUT, DELETE |
| Viaturas         | `/viaturas`                           | GET, POST, PUT, DELETE |
| Agenda           | `/agenda`, `/agenda/semana/{data}`    | GET, POST, PUT, DELETE |
| Reparações       | `/reparacoes`                         | GET, POST, PUT       |
| Operações        | `/reparacoes/{id}/operacoes`          | POST, PUT            |
| Peças            | `/pecas`                              | GET, POST, PUT, DELETE |
| Dashboard KPIs   | `/dashboard/kpis`                     | GET                  |

Todos os endpoints (exceto `/auth/**`) requerem o header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Segurança e Autenticação

- **JWT Stateless**: tokens com validade configurável (padrão 24 horas).
- **BCrypt**: passwords armazenadas com hash BCrypt.
- **RBAC**: controlo de acesso baseado em roles (MANAGER, RECEPTION, MECHANIC).
- **CORS**: permitido de qualquer origem (`*`) — configurável no `CorsFilter`.
- O token JWT é armazenado em `sessionStorage` no browser.

---

## Regras de Negócio

### Capacidade da Agenda
- **Máximo de 3 reparações por slot horário** — retorna HTTP 409 se excedido.

### Capacidade da Oficina
- **Máximo de 8 viaturas em simultâneo** — retorna HTTP 409 se excedido.

### Modelo Cliente–Viatura
- Relação 1:N (um cliente, múltiplas viaturas).
- Matrícula única.

---

## Resolução de Problemas

| Problema | Solução |
|----------|---------|
| `ClassNotFoundException: com.mysql.cj.jdbc.Driver` | Confirma que o MySQL Connector está no WAR (`mvn clean package`) |
| `Communications link failure` | Confirma que o MySQL está a correr e `DB_URL` está correto |
| `HTTP 401 Authentication required` | Token JWT inválido ou expirado — faz login novamente |
| `HTTP 403 Access denied` | O teu role não tem permissão para este endpoint |
| Tomcat não inicia o contexto | Vê os logs em `TOMCAT_HOME/logs/catalina.out` |
| `java.lang.NoSuchMethodError` | Confirma que estás a usar **Tomcat 10.1** (não 9.x) |
