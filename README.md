# 🔧 SGO | Workshop Management System

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

> **O Sistema de Gestão de Oficina (SGO) é um projeto Full-Stack académico para a disciplina de Programação Web. O seu objetivo principal é simular os requisitos técnicos e operacionais de um ambiente real de gestão oficinal, pautando-se por uma arquitetura segura e fortemente baseada em controlo de acessos por tipo de utilizador.**

## 📖 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades Core](#-funcionalidades-core)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Instalação e Execução Local](#-instalação-e-execução-local)
- [Estrutura Tecnológica](#-estrutura-tecnológica)

---

## 🚀 Visão Geral

Desenvolvido para centralizar e digitalizar todo o fluxo de trabalho de uma oficina automóvel profissional. Desde a entrada do cliente e viatura na receção, passando pela área de reparações executada pelo corpo de mecânicos e terminando na faturação e análise de dashboard gerencial.

---

## ⚙️ Funcionalidades Core

O sistema está segmentado em módulos inteligentes protegidos por controlo de segurança baseado no papel (*Role-Based Access Control*):

* **👩‍💼 Receção e Gestão (Administração):** 
  * *Onboarding* de novos clientes e arquivo de viaturas.
  * Agendamento de intervenções automóveis.
  * Central de faturação automatizada.
  * *Audit Logs*: Histórico imutável de registos para manutenção da segurança do sistema.
* **👨‍🔧 Mão de Obra (Mecânica):**
  * Dashboard de controlo exclusivo do mecânico com tarefas pendentes.
  * Atualização do estado da viatura e reparações ativas.
  * Consulta e requisição no catálogo dinâmico de peças.

---

## 🏗️ Arquitetura do Sistema

A aplicação foi isolada de forma a evidenciar duas grandes camadas de engenharia de software separadas, garantindo um código limpo e escalável:

* **Backend Engine:** Desenvolvido integralmente em **Java** vanilla, focado numa alta fiabilidade de execução. Este motor é responsável pela abstração da base de dados, segurança de tokens, restrições e gestão da complexa lógica negocial da oficina.
* **Frontend Web App:** Construída com uma base limpa de **JavaScript (ES6), HTML5 e CSS3**. Segue uma identidade visual de alto desempenho baseada em "Dark Mode/Industrial", utilizando sessões do *browser*, assincronismo (AJAX/Fetch) e *DOM manipulation* sem poluição de grandes frameworks extra.

---

## 🛠️ Instalação e Execução Local

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USER/sgo-workshop-manager.git
cd sgo-workshop-manager
```

### 2. Dependências e Pré-Requisitos
- **Java Development Kit (JDK 17+)**
- Instalação e configuração de ambiente local de Base de Dados (se aplicável na infraestrutura).

### 3. Execução Integrada (Backend)
Na raiz da pasta, incluímos scripts nativos para inicializar rapidamente o motor Java:
```bash
iniciar.bat
```
*(Em alternativa, compile a classe Main através da sua IDE — VS Code/IntelliJ).*

### 4. Execução da Interface (Frontend)
Na vertente Web, servimos os ficheiros estáticos diretamente:
- Sugestão: Utilize a extensão **Live Server** (VS Code) apontando para a pasta `/frontend`.
- Ponto de entrada a abrir no navegador:
```bash
http://localhost:5500/frontend/index.html
```

---

## 🗂️ Estrutura Tecnológica

```text
📦 sgo-workshop-manager
 ┣ 📂 backend/        # Código-fonte Java (Classes DAO, Models, Handlers)
 ┣ 📂 database/       # Schemas relacionais (SQL)
 ┣ 📂 frontend/       # Interface de Utilizador (Client-Side)
 ┃ ┣ 📂 css/          # Estilização global e de componentes
 ┃ ┣ 📂 js/           # Scripts lógicos de controlo visual e auth
 ┃ ┗ 📜 index.html    # Porta principal da aplicação (Página de Login)
 ┣ 📜 iniciar.bat     # Script utilitário em Windows para lançar serviços
 ┗ 📜 README.md       # Documentação core
```

---
*Arquitetado e desenvolvido com código estruturado para a disciplina de Programação Web.*