import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import supertest from "supertest"
import { app } from "@/app.js"
import { appRoutes } from "@/http/routes.js"
import { prisma } from "@/lib/prisma.js"
import { createAndAuthenticateUser } from "@/utils/test/create-and-authenticate-user.js"

beforeAll(async () => {
	await app.register(appRoutes)
	await app.ready()
})

afterAll(async () => {
	await app.close()
})

beforeEach(async () => {
	await prisma.checkIn.deleteMany()
	await prisma.gym.deleteMany()
	await prisma.user.deleteMany()
})

describe("GET /gyms/nearby", () => {
	it("should return 200 with only the gyms near the user", async () => {
		const { token } = await createAndAuthenticateUser(app, true)

		await supertest(app.server)
			.post("/gyms")
			.set("Authorization", `Bearer ${token}`)
			.send({
				title: "Near Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			})

		await supertest(app.server)
			.post("/gyms")
			.set("Authorization", `Bearer ${token}`)
			.send({
				title: "Far Gym",
				latitude: -27.0610928,
				longitude: -49.5229501,
			})

		const response = await supertest(app.server)
			.get("/gyms/nearby")
			.query({ latitude: -27.2092052, longitude: -49.6401091 })
			.set("Authorization", `Bearer ${token}`)

		expect(response.status).toBe(200)
		expect(response.body.gyms).toHaveLength(1)
		expect(response.body.gyms).toEqual([
			expect.objectContaining({ title: "Near Gym" }),
		])
	})

	it("should return 401 when no token is provided", async () => {
		const response = await supertest(app.server)
			.get("/gyms/nearby")
			.query({ latitude: -27.2092052, longitude: -49.6401091 })

		expect(response.status).toBe(401)
	})
})
