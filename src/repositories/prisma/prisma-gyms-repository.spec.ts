import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/lib/prisma.js"
import { PrismaGymsRepository } from "./prisma-gyms-repository.js"

const USER_LAT = -27.2092052
const USER_LNG = -49.6401091

let sut: PrismaGymsRepository

beforeEach(() => {
	sut = new PrismaGymsRepository()
})

afterEach(async () => {
	await prisma.gym.deleteMany()
})

describe("PrismaGymsRepository.findManyNearby", () => {
	it("should return a gym within 10km", async () => {
		await prisma.gym.create({
			data: {
				title: "Academia Próxima",
				description: null,
				phone: null,
				latitude: USER_LAT,
				longitude: USER_LNG,
			},
		})

		const gyms = await sut.findManyNearby({ latitude: USER_LAT, longitude: USER_LNG })

		expect(gyms).toHaveLength(1)
		expect(gyms[0].title).toBe("Academia Próxima")
	})

	it("should not return a gym that is inside the bounding box but farther than 10km diagonally", async () => {
		// Este ponto está a ~11km da posição do usuário (diagonal),
		// mas dentro do retângulo de ±10km usado pela implementação anterior.
		// lat diff: 0.07° ≈ 7.77 km norte
		// lon diff: 0.08° ≈ 7.91 km leste
		// Haversine: ~11.09 km > 10 km
		await prisma.gym.create({
			data: {
				title: "Academia Diagonal Fora do Raio",
				description: null,
				phone: null,
				latitude: USER_LAT + 0.07,
				longitude: USER_LNG + 0.08,
			},
		})

		const gyms = await sut.findManyNearby({ latitude: USER_LAT, longitude: USER_LNG })

		expect(gyms).toHaveLength(0)
	})
})
