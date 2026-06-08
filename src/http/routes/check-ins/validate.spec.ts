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

describe("PATCH /check-ins/:checkInId/validate", () => {
	it("should return 200 when an admin validates a check-in", async () => {
		const { token } = await createAndAuthenticateUser(app, true)

		const user = await prisma.user.findFirstOrThrow()

		const gym = await prisma.gym.create({
			data: {
				title: "JavaScript Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			},
		})

		const checkIn = await prisma.checkIn.create({
			data: { user_id: user.id, gym_id: gym.id },
		})

		const response = await supertest(app.server)
			.patch(`/check-ins/${checkIn.id}/validate`)
			.set("Authorization", `Bearer ${token}`)

		expect(response.status).toBe(200)
		expect(response.body.checkIn.validated_at).not.toBeNull()
	})

	it("should return 403 when a non-admin tries to validate a check-in", async () => {
		const { token } = await createAndAuthenticateUser(app, false)

		const response = await supertest(app.server)
			.patch("/check-ins/any-check-in-id/validate")
			.set("Authorization", `Bearer ${token}`)

		expect(response.status).toBe(403)
	})

	it("should return 401 when no token is provided", async () => {
		const response = await supertest(app.server).patch(
			"/check-ins/any-check-in-id/validate",
		)

		expect(response.status).toBe(401)
	})

	it("should return 404 when check-in does not exist", async () => {
		const { token } = await createAndAuthenticateUser(app, true)

		const response = await supertest(app.server)
			.patch("/check-ins/non-existent-check-in-id/validate")
			.set("Authorization", `Bearer ${token}`)

		expect(response.status).toBe(404)
	})

	it("should return 400 when check-in was created more than 20 minutes ago", async () => {
		const { token } = await createAndAuthenticateUser(app, true)

		const user = await prisma.user.findFirstOrThrow()

		const gym = await prisma.gym.create({
			data: {
				title: "JavaScript Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			},
		})

		const twentyOneMinutesAgo = new Date(Date.now() - 21 * 60 * 1000)

		const checkIn = await prisma.checkIn.create({
			data: {
				user_id: user.id,
				gym_id: gym.id,
				created_at: twentyOneMinutesAgo,
			},
		})

		const response = await supertest(app.server)
			.patch(`/check-ins/${checkIn.id}/validate`)
			.set("Authorization", `Bearer ${token}`)

		expect(response.status).toBe(400)
	})
})
