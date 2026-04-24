# StockProject API 🚀

API robusta para gestão de múltiplas lojas (Multi-tenant), controle de estoque rigoroso, produtos, usuários com permissões granulares (RBAC) e auditoria completa de ações.

**Documentação Técnica** · [Repositório GitHub](https://github.com/DenisEdSilva/StockProject)

---

## 📋 Índice
- [🛠 Tecnologias](#-tecnologias)
- [🌟 Funcionalidades Principais](#-funcionalidades-principais)
- [🏗 Arquitetura de Permissões (RBAC)](#-arquitetura-de-permissões-rbac)
- [📦 Instalação e Setup](#-instalação-e-setup)
- [🔧 Variáveis de Ambiente](#-variáveis-de-ambiente)
- [🔑 Autenticação e Segurança](#-autenticação-e-segurança)
- [📚 Documentação das Rotas](#-documentação-das-rotas)
  - [Autenticação e Sessões](#autenticação-e-sessões)
  - [Gestão de Owners (Donos)](#gestão-de-owners-donos)
  - [Gestão de Lojas (Stores)](#gestão-de-lojas-stores)
  - [Cargos e Permissões (Roles)](#cargos-e-permissões-roles)
  - [Funcionários (StoreUsers)](#funcionários-storeusers)
  - [Categorias e Produtos](#categorias-e-produtos)
  - [Movimentações de Estoque](#movimentações-de-estoque)
  - [Auditoria](#auditoria)
- [🚨 Tratamento de Erros](#-tratamento-de-erros)

---

## 🛠 Tecnologias
- **Runtime:** Node.js & Express
- **Linguagem:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Cache & Sessão:** Redis
- **Segurança:** Bcryptjs (Hash de senhas) e JSON Web Token (JWT)
- **Banco de Dados:** PostgreSQL

---

## 🌟 Funcionalidades Principais
- **Multi-tenancy:** Isolamento total de dados entre diferentes lojas.
- **Hierarquia de Usuários:** Distinção clara entre `OWNER` (Dono da conta) e `STORE_USER` (Funcionário da loja).
- **Controle de Estoque Inteligente:** Movimentações de Entrada (IN), Saída (OUT) e Transferência entre lojas (TRANSFER) com validação de saldo e integridade.
- **Sistema de Reversão:** Capacidade de reverter movimentações de estoque mantendo o histórico de auditoria.
- **Auditoria Centralizada:** Registro automático de logs (`AuditLog`) para ações críticas e rastreamento de atividade (`ActivityTracker`).
- **Soft Delete:** Sistema de deleção lógica com períodos de retenção configuráveis antes da exclusão definitiva.

---

## 🏗 Arquitetura de Permissões (RBAC)
A API utiliza um modelo **RBAC (Role-Based Access Control)** padronizado pelos verbos HTTP para facilitar a integração com o Frontend:
- **POST:** Permissão para criar recursos.
- **GET:** Permissão para leitura/listagem.
- **PUT:** Permissão para atualização total/edição.
- **PATCH:** Permissão para atualizações parciais ou reversões.
- **DELETE:** Permissão para exclusão.

---

## 📦 Instalação e Setup

```bash
# 1. Clone o repositório
git clone [https://github.com/DenisEdSilva/StockProject.git](https://github.com/DenisEdSilva/StockProject.git)

# 2. Acesse a pasta do projeto
cd StockProject

# 3. Instale as dependências
npm install

# 4. Configure o banco de dados (Prisma)
npx prisma migrate dev

# 5. Popule as permissões iniciais (Seed)
npx prisma db seed

# 6. Inicie o servidor em modo de desenvolvimento
npm run dev

```
---

## 🔧 Variaveis de Ambiente

Crie um arquivo .env na raiz do projeto:
```bash
# Conexão com Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/StockProject?schema=public"

# Segurança
JWT_SECRET="sua_chave_secreta_aqui"

# Configurações de Retenção (em minutos)
SOFT_DELETE_RETENTION_MINUTES=30
INACTIVITY_THRESHOLD_MINUTES=30
USER_DELETION_PERIOD=43200 # 30 dias em minutos
DELETION_GRACE_PERIOD=1440  # 1 dia em minutos

# Redis (Opcional se configurado localmente)
REDIS_URL="redis://localhost:6379"

```

## 🔑 Autenticacao e Segurança
- **Header Requisitado**: Authorization: Bearer <JWT_TOKEN>
- **Middleware authenticated**: Valida o token e injeta os dados do usuário no req.user
- **Middleware authorized**: Verifica se o usuário possui a combinação correta de ACTION (Verbo HTTP) e RESOURCE no seu perfil de acesso.

## 📚 Documentacao das Rotas
#### Usuarios

| Método	|   Endpoint  | Descrição                         |   Permissão   |
|---------|-------------|-----------------------------------|---------------|
| POST	  | /stores	    | Cria loja                         |    Nenhuma    |
| POST    | /sessions   | Autentica um usuário              |    Nenhuma    |
| GET     | /me         | Retorna os dados do usuario Owner |    GET:USER   |
| PUT     | /me/:userId | Atualiza usuário                  |    PUT:USER   |
| DELETE  | /me/:userId | Soft delete do usuario            |  DELETE:USER  |

#### Lojas

|  Método 	| Endpoint | Descrição | Permissão |
|-----------|----------|-----------|-----------|
|   POST	  | /stores	 | Cria loja | POST:STORE |
|    GET    | /stores | Lista as lojas do owner | GET:STORE |
|    GET    | /stores/:storeId/transfer-targets | Lista destinos de transferência | GET:TRANSFER |
|    PUT    | /stores/:storeId | Atualiza a loja | PUT:STORE |
|  DELETE   | /stores/:storeId | Soft delete da loja | DELETE:STORE |
|    PUT    | /stores/:storeId/revert | Reverte a deleção da loja | PUT:STORE_DELETE |

#### Roles

|  Método 	| Endpoint | Descrição | Permissão |
|-----------|----------|-----------|-----------|
| POST	  | /stores/storeId/roles	 | Cria uma role |
| GET | /stores/:storeId/roles | Lista das roles | GET:ROLE |
| PUT | /stores/:storeId/roles/:roleId | Atualiza a role | PUT:ROLE |
| DELETE | /stores/:storeId/roles/:roleId | Delete a role | DELETE:ROLE |

#### Store-Users

|  Método 	| Endpoint | Descrição | Permissão |
|-----------|----------|-----------|-----------|
| POST	  | /stores/:storeId/users | Cria funcionário | POST:STORE_USER |
| POST | /stores/:storeId/sessions | Autentica funcionário | Nenhuma |
| GET | /stores/:storeId/users | Lista funcionários | GET:STORE_USER |
| PUT | /stores/:storeId/users/:storeUserId | Atualiza funcionário | PUT:STORE_USER |
| DELETE | /stores/:storeId/users/:storeUserId | Exclui funcionário	| DELETE:STORE_USER |

#### Categorias

|  Método 	| Endpoint | Descrição | Permissão |
|-----------|----------|-----------|-----------|
| POST	  | /stores/:storeId/categories	 | Cria categoria | POST:CATEGORY |
| GET | /stores/:storeId/categories | Lista categorias | GET:CATEGORY |
| PUT | /stores/:storeId/categories/:categoryId	| Atualiza categoria | PUT:CATEGORY |
| DELETE | /stores/:storeId/categories/:categoryId | Exclui categoria	| DELETE:CATEGORY |

#### Produtos

|  Método 	| Endpoint | Descrição | Permissão |
|-----------|----------|-----------|-----------|
| POST	  | /stores/:storeId/categories/:categoryId/products	 | Cria produto | PUT:PRODUCT |
| GET | /stores/:storeId/categories/:categoryId/products | Lista produtos	| GET:PRODUCT |
| PUT | /stores/:storeId/categories/:categoryId/products/:productId	| Atualiza produto | PUT:PRODUCT |
| DELETE | /stores/:storeId/categories/:categoryId/products/:productId | Exclui produto	 | DELETE:PRODUCT |

#### Estoque

|  Método 	| Endpoint | Descrição | Permissão |
|-----------|----------|-----------|-----------|
| POST | /stores/:storeId/products/:productId/stocks/movements | Cria movimentação | POST:STOCK |
| GET | /stores/:storeId/products/:productId/stocks/movements | Lista movimentações | GET:STOCK |
| PATCH | /stores/:storeId/products/:productId/stocks/movements/:movementId/revert | Reverte movimentação | POST:STOCK |

#### Auditoria

|  Método 	| Endpoint | Descrição | Permissão |
|-----------|----------|-----------|-----------|
| GET |	/audit-logs | Lista logs de auditoria | GET:AUDIT_LOG |

## 🚨 Tratamento de Erros
```bash
{
  "status": "error",
  "name": "ValidationError | NotFoundError | ForbiddenError",
  "message": "Mensagem detalhada do erro"
}
```
## Principais Códigos HTTPs

Principais Códigos HTTP:

- 400 Bad Request: Erros de validação.

- 401 Unauthorized: Token ausente ou inválido.

- 403 Forbidden: Falta de permissão no RBAC ou tentativa de acesso a outra loja.

- 404 Not Found: Recurso não encontrado ou deletado.

- 409 Conflict: Violação de regra de negócio (ex: estoque insuficiente).

- 500 Internal Server Error: Erro inesperado no servidor.

Desenvolvido por Denis Ed Silva 🚀