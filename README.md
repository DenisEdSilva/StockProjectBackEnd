# StockProject

# StockProject API

API para gestão de lojas, estoque, produtos, usuários e auditoria.  
**Documentação Oficial** · [Repositório](https://github.com/DenisEdSilva/StockProject)

---

## Índice
- [🛠 Tecnologias](#tecnologias)
- [🌟 Funcionalidades Principais](#funcionalidades-principais)
- [📦 Instalação](#instalação)
- [🔧 Variáveis de Ambiente](#variaveis-de-ambiente)
- [🔑 Autenticação](#autenticacao)
- [📚 Documentação das Rotas](#documentacao-das-rotas)
  - [Usuários](#usuarios)
  - [Lojas](#lojas)
  - [Perfis (Roles)](#perfis-roles)
  - [Funcionários (StoreUsers)](#funcionarios-storeusers)
  - [Categorias](#categorias)
  - [Produtos](#produtos)
  - [Estoque](#estoque)
  - [Auditoria](#auditoria)
- [🚨 Tratamento de Erros](#tratamento-de-erros)

---

## 🛠 Tecnologias
- **Node.js** & **Express**  
- **Prisma** (PostgreSQL)  
- **JWT** (Autenticação)  
- **Redis** (Cache de sessões)  
- **Bcrypt** (Criptografia de senhas)

---

## 🌟 Funcionalidades Principais
- Gestão de múltiplas lojas com donos (owners) e funcionários (storeUsers).  
- Controle de permissões baseado em roles.  
- Auditoria detalhada de todas as ações críticas.  
- Soft delete e recuperação de recursos.  
- Movimentações de estoque com reversão.  

---

## 📦 Instalação
```bash
# Clone o repositório
git clone https://github.com/DenisEdSilva/StockProject.git

# Instale as dependências
npm install

# Execute as migrações e seeds do Prisma (cria estrutura + permissões padrão)
npx prisma migrate dev
npx prisma db seed

# Inicie o servidor
npm run dev

```
---

## 🔧 Variáveis de Ambiente {#variaveis-de-ambiente}
```bash
Crie um arquivo .env na raiz do projeto:
DATABASE_URL="postgresql://postgres:admin@localhost:5432/StockProject?schema=public"

#secret JWT hash generation
JWT_SECRET = 076ee6c3d7dd190d9a45bad13d036c5a

#tempo para deleção dos dados
SOFT_DELETE_RETENTION_MINUTES = 30

#tempo para marcar como inativo
INACTIVITY_THRESHOLD_MINUTES = 30

#tempo para a deleção de usuario
USER_DELETION_PERIOD = 30

#periodo de graça para a deleção de usuario
DELETION_GRACE_PERIOD = 30

```

## 🔑 Autenticação {#autenticacao}
Header: Authorization: Bearer <JWT_TOKEN>
Middleware: authorized para permissões

## 📚 Documentação das Rotas {#documentacao-das-rotas}
## Usuários {#usuarios}
```bash
Método	Endpoint	Descrição
POST	/users	Cria usuário owner
Lojas {#lojas}
Método	Endpoint	Descrição
POST	/stores	Cria loja


```
## 🚨 Tratamento de Erros {#tratamento-de-erros}
```bash
{
  "error": "Tipo do erro",
  "message": "Descrição detalhada"
}
```