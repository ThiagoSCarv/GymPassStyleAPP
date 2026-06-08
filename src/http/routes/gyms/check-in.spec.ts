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

describe("POST /gyms/:gymId/check-ins", () => {
	it("should return 201 when user checks in at a nearby gym", async () => {
		const { token } = await createAndAuthenticateUser(app)

		const gym = await prisma.gym.create({
			data: {
				title: "JavaScript Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			},
		})

		const response = await supertest(app.server)
			.post(`/gyms/${gym.id}/check-ins`)
			.set("Authorization", `Bearer ${token}`)
			.send({ latitude: -27.2092052, longitude: -49.6401091 })

		expect(response.status).toBe(201)
	})

	it("should return 400 when user is too far from the gym", async () => {
		const { token } = await createAndAuthenticateUser(app)

		const gym = await prisma.gym.create({
			data: {
				title: "JavaScript Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			},
		})

		const response = await supertest(app.server)
			.post(`/gyms/${gym.id}/check-ins`)
			.set("Authorization", `Bearer ${token}`)
			.send({ latitude: -27.3, longitude: -49.7 })

		expect(response.status).toBe(400)
	})

	it("should return 409 when user has already checked in at any gym today", async () => {
		const { token } = await createAndAuthenticateUser(app)

		const user = await prisma.user.findFirstOrThrow()

		const gym = await prisma.gym.create({
			data: {
				title: "JavaScript Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			},
		})

		await prisma.checkIn.create({
			data: { user_id: user.id, gym_id: gym.id },
		})

		const response = await supertest(app.server)
			.post(`/gyms/${gym.id}/check-ins`)
			.set("Authorization", `Bearer ${token}`)
			.send({ latitude: -27.2092052, longitude: -49.6401091 })

		expect(response.status).toBe(409)
	})

	it("should return 401 when no token is provided", async () => {
		const response = await supertest(app.server)
			.post("/gyms/any-gym-id/check-ins")
			.send({ latitude: -27.2092052, longitude: -49.6401091 })

		expect(response.status).toBe(401)
	})
})
