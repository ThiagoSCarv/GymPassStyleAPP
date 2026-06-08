# Refresh Token com Cookie HttpOnly

**Data:** 2026-06-08  
**Status:** aprovado

## Visão geral

Adicionar refresh token stateless (JWT) ao fluxo de autenticação existente. O access token continua sendo devolvido no corpo da resposta (1 hora de validade). O refresh token é emitido como cookie httponly (30 dias de validade) e usado para renovar o access token sem nova senha.

Nenhuma tabela nova no banco de dados. Nenhum logout "real" no servidor — o cookie é apenas apagado no cliente.

## Rotas

### `POST /sessions` (existente — modificar)

Além do comportamento atual, passa a:
- Assinar um segundo JWT com payload `{ sub: userId, aud: 'refresh' }` e `expiresIn: '30d'`
- Definir o cookie `refreshToken` na resposta

Resposta continua `200 { token }`.

### `POST /sessions/refresh` (nova)

- Pública (sem `verifyJwt`)
- Lê o cookie `refreshToken`
- Verifica assinatura JWT e audience via `request.jwtVerify({ verify: { allowedAud: 'refresh' } })`
- Devolve `200 { token }` com um novo access token
- Erros: `401 { message: "Unauthorized." }` se cookie ausente, token inválido ou expirado

### `DELETE /sessions` (nova)

- Pública
- Apaga o cookie `refreshToken` (clearCookie)
- Devolve `200 {}`
- Não requer autenticação — não há estado no servidor para invalidar

## Cookie `refreshToken`

| Atributo | Valor |
|---|---|
| `httpOnly` | `true` |
| `secure` | `true` em produção, `false` em dev/test |
| `sameSite` | `'lax'` |
| `path` | `'/'` |
| `maxAge` | `2592000` (30 dias em segundos) |

## Payload dos tokens

**Access token** (sem mudança):
```json
{ "sub": "<userId>", "role": "MEMBER" | "ADMIN" }
```
Expiração: `1h`

**Refresh token:**
```json
{ "sub": "<userId>", "aud": "refresh" }
```
Expiração: `30d`

## Mudanças em arquivos existentes

| Arquivo | Mudança |
|---|---|
| `src/app.ts` | Registrar `@fastify/cookie` |
| `src/http/routes.ts` | Registrar `refreshRoute` e `logoutRoute` no tier público |
| `src/http/routes/users/authenticate.ts` | Emitir refresh token e setar cookie |
| `src/http/routes/users/authenticate.spec.ts` | Assertar `Set-Cookie` na resposta de sucesso |

## Novos arquivos

| Arquivo | Descrição |
|---|---|
| `src/http/routes/users/refresh.ts` | Rota `POST /sessions/refresh` |
| `src/http/routes/users/refresh.spec.ts` | Testes da rota de refresh |
| `src/http/routes/users/logout.ts` | Rota `DELETE /sessions` |
| `src/http/routes/users/logout.spec.ts` | Testes da rota de logout |

## Dependência nova

`@fastify/cookie` — plugin oficial do Fastify para leitura e escrita de cookies.

## Testes

**`refresh.spec.ts`:**
- `POST /sessions/refresh` com cookie válido → `200 { token: string }`
- `POST /sessions/refresh` sem cookie → `401`
- `POST /sessions/refresh` com token corrompido → `401`
- `POST /sessions/refresh` com access token no lugar do refresh (audience errada) → `401`

**`logout.spec.ts`:**
- `DELETE /sessions` → `200 {}` e cookie `refreshToken` apagado na resposta

**`authenticate.spec.ts` (atualização):**
- `POST /sessions` bem-sucedido → `200 { token }` + `Set-Cookie: refreshToken=...`

**`createAndAuthenticateUser.ts`** — sem alteração; continua extraindo `token` do corpo.

## O que não muda

- `verifyJwt` middleware — continua verificando o Bearer token no header
- Use cases existentes — nenhuma mudança
- Estrutura de rotas protegidas/admin — inalterada
- Helper `createAndAuthenticateUser` — inalterado
