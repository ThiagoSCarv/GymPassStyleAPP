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

describe("GET /check-ins/metrics", () => {
	it("should return 200 with the total check-in count for the user", async () => {
		const { token } = await createAndAuthenticateUser(app)

		const user = await prisma.user.findFirstOrThrow()

		const gym = await prisma.gym.create({
			data: {
				title: "JavaScript Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			},
		})

		await prisma.checkIn.createMany({
			data: [
				{ user_id: user.id, gym_id: gym.id },
				{ user_id: user.id, gym_id: gym.id },
				{ user_id: user.id, gym_id: gym.id },
			],
		})

		const response = await supertest(app.server)
			.get("/check-ins/metrics")
			.set("Authorization", `Bearer ${token}`)

		expect(response.status).toBe(200)
		expect(response.body).toEqual({ checkInsCount: 3 })
	})

	it("should return 401 when no token is provided", async () => {
		const response = await supertest(app.server).get("/check-ins/metrics")

		expect(response.status).toBe(401)
	})
})
