# GymPass Style App

REST API para gerenciamento de check-ins em academias, inspirado no modelo do GymPass. Construído com Node.js, Fastify, Prisma e PostgreSQL, seguindo princípios de Clean Architecture e SOLID.

## Tecnologias

- **Runtime**: Node.js com TypeScript
- **Framework HTTP**: Fastify 5 com Zod type provider
- **ORM**: Prisma 7 com driver adapter `pg`
- **Banco de dados**: PostgreSQL
- **Autenticação**: JWT (access token 1h + refresh token 30d via cookie httpOnly)
- **Testes**: Vitest + Supertest
- **Linter/Formatter**: Biome
- **Build**: tsup

## Requisitos

- Node.js 20+
- pnpm
- Docker (para o PostgreSQL)

## Instalação

```bash
pnpm install
```

## Configuração

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

| Variável       | Descrição                                      |
|----------------|------------------------------------------------|
| `DATABASE_URL` | URL de conexão PostgreSQL                      |
| `JWT_SECRET`   | Segredo para assinar os JWTs                   |
| `NODE_ENV`     | `development` \| `test` \| `production`        |
| `PORT`         | Porta HTTP (padrão: 3000)                      |

Para testes, crie um `.env.test` apontando para um banco separado — o `vitest.setup.ts` o carrega automaticamente.

## Banco de dados

```bash
docker compose up -d   # Sobe o PostgreSQL
pnpm db:migrate        # Executa as migrations
pnpm db:generate       # Regenera o Prisma Client
pnpm db:seed           # Popula com dados de exemplo
```

## Execução

```bash
pnpm dev      # Desenvolvimento com hot-reload (tsx)
pnpm build    # Compila para dist/
pnpm start    # Executa o build compilado
```

## Testes

```bash
pnpm test               # Roda todos os testes
pnpm test:coverage      # Relatório de cobertura (v8)
pnpm test:ui            # Interface visual do Vitest no browser
pnpm test <arquivo>     # Roda um arquivo de teste específico
```

## Endpoints

A documentação interativa (Scalar UI) está disponível em `/docs` com o servidor rodando.

### Usuários (público)

| Método | Rota            | Descrição                  |
|--------|-----------------|----------------------------|
| POST   | `/users`        | Registrar novo usuário     |
| POST   | `/sessions`     | Autenticar (login)         |
| POST   | `/sessions/refresh` | Renovar access token   |
| DELETE | `/sessions`     | Logout (limpa o cookie)    |

### Usuários (autenticado)

| Método | Rota  | Descrição                        |
|--------|-------|----------------------------------|
| GET    | `/me` | Retorna o perfil do usuário logado |

### Academias (autenticado)

| Método | Rota                          | Descrição                            |
|--------|-------------------------------|--------------------------------------|
| GET    | `/gyms/search?q=&page=`       | Buscar academias por nome (paginado) |
| GET    | `/gyms/nearby?lat=&lng=`      | Listar academias próximas (10 km)    |
| POST   | `/gyms/:gymId/check-ins`      | Realizar check-in em uma academia    |

### Academias (admin)

| Método | Rota                              | Descrição                    |
|--------|-----------------------------------|------------------------------|
| POST   | `/gyms`                           | Cadastrar nova academia       |
| PATCH  | `/check-ins/:checkInId/validate`  | Validar um check-in           |

### Check-ins (autenticado)

| Método | Rota                  | Descrição                              |
|--------|-----------------------|----------------------------------------|
| GET    | `/check-ins/history`  | Histórico de check-ins do usuário (paginado) |
| GET    | `/check-ins/metrics`  | Total de check-ins do usuário          |

## Regras de Negócio

- Não são permitidos dois usuários com o mesmo e-mail
- Máximo de um check-in por usuário por dia
- Check-in exige que o usuário esteja a no máximo **100 m** da academia
- Validação de check-in deve ocorrer em até **20 minutos** após a criação
- Somente admins podem validar check-ins e cadastrar academias
- Senhas armazenadas com bcrypt
- Listagens paginadas com 20 itens por página

## Arquitetura

```
src/
├── use-cases/          # Lógica de negócio pura (uma classe por caso de uso)
│   ├── errors/         # Erros de domínio tipados
│   └── factories/      # Fábricas que montam o grafo de dependências
├── repositories/
│   ├── prisma/         # Implementações de produção (PostgreSQL)
│   └── in-memory/      # Implementações para testes unitários
├── http/
│   ├── middlewares/    # verifyJwt, verifyUserRole
│   └── routes/         # Handlers Fastify (users/, gyms/, check-ins/)
├── env/                # Validação de variáveis de ambiente com Zod
└── lib/                # Cliente Prisma singleton
```

Cada camada depende apenas da camada interna: `HTTP → Use Cases → Interfaces de Repositório ← Implementações`.
