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

describe("POST /sessions", () => {
	it("should return 200 and a token when credentials are valid", async () => {
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
		expect(response.body).toMatchObject({ token: expect.any(String) })
	})

	it("should return 401 when email is not registered", async () => {
		const response = await supertest(app.server).post("/sessions").send({
			email: "nonexistent@example.com",
			password: "123456",
		})

		expect(response.status).toBe(401)
	})

	it("should return 401 when password is wrong", async () => {
		await supertest(app.server).post("/users").send({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		})

		const response = await supertest(app.server).post("/sessions").send({
			email: "johndoe@example.com",
			password: "wrong-password",
		})

		expect(response.status).toBe(401)
	})

	it("should return 400 when email format is invalid", async () => {
		const response = await supertest(app.server).post("/sessions").send({
			email: "not-an-email",
			password: "123456",
		})

		expect(response.status).toBe(400)
	})
})
