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

describe("GET /me", () => {
	it("should return 200 with user profile when authenticated", async () => {
		await supertest(app.server).post("/users").send({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		})

		const authResponse = await supertest(app.server).post("/sessions").send({
			email: "johndoe@example.com",
			password: "123456",
		})

		const { token } = authResponse.body

		const response = await supertest(app.server)
			.get("/me")
			.set("Authorization", `Bearer ${token}`)

		expect(response.status).toBe(200)
		expect(response.body).toMatchObject({
			user: {
				name: "John Doe",
				email: "johndoe@example.com",
			},
		})
		expect(response.body.user).not.toHaveProperty("password_hash")
	})

	it("should return 401 when no token is provided", async () => {
		const response = await supertest(app.server).get("/me")

		expect(response.status).toBe(401)
	})

	it("should return 401 when token is invalid", async () => {
		const response = await supertest(app.server)
			.get("/me")
			.set("Authorization", "Bearer invalid-token")

		expect(response.status).toBe(401)
	})
})
