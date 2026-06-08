# Refresh Token + Cookie HttpOnly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar refresh token stateless (JWT, 30 dias) em cookie httponly e access token (1 hora) no corpo da resposta, com rotas de renovação e logout.

**Architecture:** O `POST /sessions` passa a emitir dois JWTs — access token (1h) no corpo e refresh token (30d) em cookie httponly. Uma nova rota `POST /sessions/refresh` lê o cookie, verifica a assinatura e a audience `'refresh'`, e devolve um novo access token. `DELETE /sessions` apenas limpa o cookie. Nenhum banco de dados envolvido.

**Tech Stack:** Fastify 5, `@fastify/jwt` v10 (fast-jwt), `@fastify/cookie`, Vitest, supertest

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/app.ts` | Modificar | Registrar `@fastify/cookie` |
| `src/http/routes.ts` | Modificar | Registrar `refreshRoute` e `logoutRoute` no tier público |
| `src/http/routes/users/authenticate.ts` | Modificar | Emitir refresh token e setar cookie httponly |
| `src/http/routes/users/authenticate.spec.ts` | Modificar | Assertar `Set-Cookie` na resposta de login |
| `src/http/routes/users/refresh.ts` | Criar | Rota `POST /sessions/refresh` |
| `src/http/routes/users/refresh.spec.ts` | Criar | Testes da rota de refresh |
| `src/http/routes/users/logout.ts` | Criar | Rota `DELETE /sessions` |
| `src/http/routes/users/logout.spec.ts` | Criar | Testes da rota de logout |

---

## Task 1: Instalar e registrar `@fastify/cookie`

**Files:**
- Modify: `src/app.ts`

- [ ] **Step 1: Instalar o pacote**

```bash
pnpm add @fastify/cookie
```

Expected: linha `"@fastify/cookie": "^..."` aparece em `dependencies` no `package.json`.

- [ ] **Step 2: Registrar em `src/app.ts`**

Adicionar o import e o `app.register` após os outros plugins. O arquivo completo fica:

```ts
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import fastify from "fastify";
import {
	jsonSchemaTransform,
	jsonSchemaTransformObject,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "./env/index.js";

export const app = fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCookie);
app.register(fastifyJwt, { secret: env.JWT_SECRET });

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Solid Node API",
			description: "API documentation",
			version: "1.0.0",
		},
	},
	transform: jsonSchemaTransform,
	transformObject: jsonSchemaTransformObject,
});

app.register(ScalarApiReference, {
	routePrefix: "/docs",
});

app.setErrorHandler((error, _request, reply) => {
	if (env.NODE_ENV === "development") {
		console.error(error);
	}

	if (error.statusCode) {
		return reply.status(error.statusCode).send({ message: error.message });
	}

	return reply.status(500).send({ message: "Internal server error." });
});
```

- [ ] **Step 3: Verificar que a build compila sem erros**

```bash
pnpm build
```

Expected: sem erros TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/app.ts package.json pnpm-lock.yaml
git commit -m "chore: install and register @fastify/cookie"
```

---

## Task 2: Modificar `POST /sessions` para emitir refresh token em cookie

**Files:**
- Modify: `src/http/routes/users/authenticate.spec.ts`
- Modify: `src/http/routes/users/authenticate.ts`

- [ ] **Step 1: Escrever o teste que falha em `authenticate.spec.ts`**

Adicionar o caso abaixo ao `describe("POST /sessions", ...)` existente (após os casos já existentes):

```ts
it("should set a refreshToken httponly cookie on successful authentication", async () => {
  await supertest(app.server).post("/users").send({
    name: "John Doe",
    email: "johndoe@example.com",
    password: "123456",
  })

  const response = await supertest(app.server).post("/sessions").send({
    email: "johndoe@example.com",
    password: "123456",
  })

  expect(response.status).toBe(200)

  const setCookieHeader = response.headers["set-cookie"] as string[] | string
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true)
  expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true)
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
pnpm test src/http/routes/users/authenticate.spec.ts
```

Expected: FAIL — o teste novo falha porque `Set-Cookie` não existe na resposta.

- [ ] **Step 3: Implementar em `authenticate.ts`**

Conteúdo completo do arquivo:

```ts
import type { FastifyInstance } from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeAuthenticateUseCase } from "@/use-cases/factories/make-authenticate-use-case.js"
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error.js"
import { env } from "@/env/index.js"

export async function authenticateRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/sessions",
		schema: {
			summary: "Authenticate a user",
			tags: ["sessions"],
			body: z.object({
				email: z.string().email(),
				password: z.string().min(6),
			}),
			response: {
				200: z.object({ token: z.string() }),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { email, password } = request.body

			const authenticateUseCase = makeAuthenticateUseCase()

			try {
				const { user } = await authenticateUseCase.execute({ email, password })

				const token = await reply.jwtSign(
					{ role: user.role },
					{ sign: { sub: user.id, expiresIn: "1h" } },
				)

				const refreshToken = await reply.jwtSign(
					{ role: user.role },
					{ sign: { sub: user.id, expiresIn: "30d", audience: "refresh" } },
				)

				return reply
					.setCookie("refreshToken", refreshToken, {
						path: "/",
						httpOnly: true,
						secure: env.NODE_ENV === "production",
						sameSite: "lax",
						maxAge: 60 * 60 * 24 * 30,
					})
					.status(200)
					.send({ token })
			} catch (err) {
				if (err instanceof InvalidCredentialsError) {
					return reply.status(401).send({ message: err.message })
				}

				throw err
			}
		},
	})
}
```

- [ ] **Step 4: Rodar os testes do arquivo para confirmar que passam**

```bash
pnpm test src/http/routes/users/authenticate.spec.ts
```

Expected: todos os casos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/http/routes/users/authenticate.ts src/http/routes/users/authenticate.spec.ts
git commit -m "feat(auth): emit refresh token as httponly cookie on POST /sessions"
```

---

## Task 3: Criar rota `POST /sessions/refresh`

**Files:**
- Create: `src/http/routes/users/refresh.spec.ts`
- Create: `src/http/routes/users/refresh.ts`
- Modify: `src/http/routes.ts`

- [ ] **Step 1: Escrever `refresh.spec.ts` (todos os casos, espera 404 por enquanto)**

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import supertest from "supertest"
import { app } from "@/app.js"
import { appRoutes } from "@/http/routes.js"
import { prisma } from "@/lib/prisma.js"

beforeAll(async () => {
  await app.register(appRoutes)
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  await prisma.user.deleteMany()
})

describe("POST /sessions/refresh", () => {
  it("should return 200 and a new access token when refresh cookie is valid", async () => {
    await supertest(app.server).post("/users").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    })

    const authResponse = await supertest(app.server).post("/sessions").send({
      email: "johndoe@example.com",
      password: "123456",
    })

    const setCookieHeader = authResponse.headers["set-cookie"] as string[] | string
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="))!

    const response = await supertest(app.server)
      .post("/sessions/refresh")
      .set("Cookie", refreshCookie)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ token: expect.any(String) })
  })

  it("should return 401 when no refresh cookie is present", async () => {
    const response = await supertest(app.server).post("/sessions/refresh")

    expect(response.status).toBe(401)
  })

  it("should return 401 when refresh cookie contains a corrupted token", async () => {
    const response = await supertest(app.server)
      .post("/sessions/refresh")
      .set("Cookie", "refreshToken=invalid.token.here")

    expect(response.status).toBe(401)
  })

  it("should return 401 when cookie contains an access token instead of refresh token", async () => {
    await supertest(app.server).post("/users").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    })

    const authResponse = await supertest(app.server).post("/sessions").send({
      email: "johndoe@example.com",
      password: "123456",
    })

    const { token: accessToken } = authResponse.body as { token: string }

    const response = await supertest(app.server)
      .post("/sessions/refresh")
      .set("Cookie", `refreshToken=${accessToken}`)

    expect(response.status).toBe(401)
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falham**

```bash
pnpm test src/http/routes/users/refresh.spec.ts
```

Expected: FAIL — todos os casos retornam 404 (rota não existe ainda).

- [ ] **Step 3: Criar `src/http/routes/users/refresh.ts`**

```ts
import type { FastifyInstance } from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

export async function refreshRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/sessions/refresh",
		schema: {
			summary: "Refresh access token",
			tags: ["sessions"],
			response: {
				200: z.object({ token: z.string() }),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const refreshToken = request.cookies?.refreshToken

			if (!refreshToken) {
				return reply.status(401).send({ message: "Unauthorized." })
			}

			try {
				const decoded = app.jwt.verify<{
					sub: string
					role: "ADMIN" | "MEMBER"
				}>(refreshToken, { allowedAud: "refresh" })

				const token = await reply.jwtSign(
					{ role: decoded.role },
					{ sign: { sub: decoded.sub, expiresIn: "1h" } },
				)

				return reply.status(200).send({ token })
			} catch {
				return reply.status(401).send({ message: "Unauthorized." })
			}
		},
	})
}
```

- [ ] **Step 4: Registrar a rota em `src/http/routes.ts`**

Adicionar o import e a linha de registro no tier público (logo após `authenticateRoute`):

```ts
// import a adicionar:
import { refreshRoute } from "./routes/users/refresh.js";

// linha a adicionar em appRoutes, após app.register(authenticateRoute):
app.register(refreshRoute);
```

- [ ] **Step 5: Rodar os testes para confirmar que passam**

```bash
pnpm test src/http/routes/users/refresh.spec.ts
```

Expected: todos os 4 casos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/http/routes/users/refresh.ts src/http/routes/users/refresh.spec.ts src/http/routes.ts
git commit -m "feat(auth): add POST /sessions/refresh route"
```

---

## Task 4: Criar rota `DELETE /sessions` (logout)

**Files:**
- Create: `src/http/routes/users/logout.spec.ts`
- Create: `src/http/routes/users/logout.ts`
- Modify: `src/http/routes.ts`

- [ ] **Step 1: Escrever `logout.spec.ts`**

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import supertest from "supertest"
import { app } from "@/app.js"
import { appRoutes } from "@/http/routes.js"

beforeAll(async () => {
  await app.register(appRoutes)
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe("DELETE /sessions", () => {
  it("should return 200 and clear the refreshToken cookie", async () => {
    const response = await supertest(app.server).delete("/sessions")

    expect(response.status).toBe(200)

    const setCookieHeader = response.headers["set-cookie"] as string[] | string
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    expect(cookies.some((c) => c.includes("refreshToken=;"))).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
pnpm test src/http/routes/users/logout.spec.ts
```

Expected: FAIL — 404 (rota não existe).

- [ ] **Step 3: Criar `src/http/routes/users/logout.ts`**

```ts
import type { FastifyInstance } from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

export async function logoutRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/sessions",
		schema: {
			summary: "Logout user",
			tags: ["sessions"],
			response: {
				200: z.object({}),
			},
		},
		handler: async (_request, reply) => {
			return reply
				.clearCookie("refreshToken", { path: "/" })
				.status(200)
				.send({})
		},
	})
}
```

- [ ] **Step 4: Registrar a rota em `src/http/routes.ts`**

Adicionar o import e a linha de registro no tier público (após `refreshRoute`):

```ts
// import a adicionar:
import { logoutRoute } from "./routes/users/logout.js";

// linha a adicionar em appRoutes, após app.register(refreshRoute):
app.register(logoutRoute);
```

- [ ] **Step 5: Rodar os testes para confirmar que passam**

```bash
pnpm test src/http/routes/users/logout.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/http/routes/users/logout.ts src/http/routes/users/logout.spec.ts src/http/routes.ts
git commit -m "feat(auth): add DELETE /sessions logout route"
```

---

## Task 5: Confirmar suite completa

- [ ] **Step 1: Rodar todos os testes**

```bash
pnpm test
```

Expected: todos os testes PASS — nenhuma regressão nos testes de outras rotas.

- [ ] **Step 2: Se houver falha**

Investigar o arquivo que falhou. O mais provável é que algum spec file registre `appRoutes` duas vezes (conflito de rotas no mesmo processo). Cada spec que precisa da app completa deve usar `beforeAll`/`afterAll` isolados, o que já é o padrão no projeto.

- [ ] **Step 3: Commit final (só se houver ajustes)**

```bash
git add -p
git commit -m "fix: adjust tests after refresh token implementation"
```
