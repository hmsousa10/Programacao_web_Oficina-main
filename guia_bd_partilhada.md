# Guia BD Partilhada (MySQL + Tailscale)

Objetivo: 3 colegas a usar a mesma base de dados, cada um em sua casa, sem custos.

## 1) Escolher o PC servidor
- Um PC Windows 11 vai ser o servidor da BD.
- Esse PC deve estar ligado quando houver uso.
- MySQL Server 8.0 instalado e a correr.

## 2) Instalar Tailscale (todos)
1. Instalar: https://tailscale.com/download
2. Entrar com a mesma conta (mesma tailnet).
3. Confirmar o IP Tailscale:
   - Windows: abrir o Tailscale e ver o IP (100.x.y.z)
   - Linux: `tailscale ip -4`

## 3) Configurar MySQL para aceitar ligacoes remotas (servidor)
### Windows
1. Abrir o ficheiro:
   `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`
2. Garantir que existe:
   `bind-address = 0.0.0.0`
3. Reiniciar o servico MySQL.

### Linux (se o servidor for Linux)
- Ficheiro tipico:
  `/etc/mysql/mysql.conf.d/mysqld.cnf`
- Garantir:
  `bind-address = 0.0.0.0`
- Reiniciar o servico:
  `sudo systemctl restart mysql`

## 4) Criar BD e utilizador (servidor)
Abrir o MySQL Workbench no servidor e executar:

```sql
CREATE DATABASE IF NOT EXISTS sgo_db;
CREATE USER 'sgo_user'@'%' IDENTIFIED BY 'senha_forte';
GRANT ALL PRIVILEGES ON sgo_db.* TO 'sgo_user'@'%';
FLUSH PRIVILEGES;
```

## 5) Firewall no servidor (Windows)
- Abrir porta TCP 3306 para rede privada.
- Alternativa: permitir o programa `mysqld.exe`.
- Como estamos a usar Tailscale, nao e preciso expor na internet publica.

## 6) Ligar no MySQL Workbench (todos)
- Hostname: IP Tailscale do servidor (ex.: `100.64.0.10`)
- Port: 3306
- Username: `sgo_user`
- Password: `senha_forte`

## 7) Backend do SGO apontado para a BD partilhada (todos)
O backend ja le estas variaveis de ambiente:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Exemplo de `DB_URL`:
```
jdbc:mysql://100.64.0.10:3306/sgo_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

### Windows (usa iniciar.bat)
1. Copiar o ficheiro:
   `config/db.env.example` -> `config/db.env`
2. Editar `config/db.env` com o IP Tailscale e credenciais.
3. Executar `iniciar.bat`.

### Linux (se alguem correr o backend)
Antes de arrancar o backend:
```
export DB_URL="jdbc:mysql://100.64.0.10:3306/sgo_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
export DB_USERNAME="sgo_user"
export DB_PASSWORD="senha_forte"
```

## 8) Testes rapidos
- Testar ping ao IP Tailscale do servidor.
- No Workbench, testar a ligacao.
- Se falhar: verificar firewall, bind-address e se o MySQL esta a correr.
