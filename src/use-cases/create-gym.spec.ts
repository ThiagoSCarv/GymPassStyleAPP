import { beforeEach, describe, expect, it } from "vitest"
import { InMemoryGymsRepository } from "@/repositories/in-memory/in-memory-gyms-repository.js"
import { CreateGymUseCase } from "./create-gym.js"

let gymsRepository: InMemoryGymsRepository
let sut: CreateGymUseCase

beforeEach(() => {
	gymsRepository = new InMemoryGymsRepository()
	sut = new CreateGymUseCase(gymsRepository)
})

describe("CreateGymUseCase", () => {
	it("should create a gym", async () => {
		const { gym } = await sut.execute({
			title: "Academia JS",
			description: null,
			phone: null,
			latitude: -27.2092052,
			longitude: -49.6401091,
		})

		expect(gym.id).toBeTruthy()
	})

	it("should store gym with the provided title", async () => {
		const { gym } = await sut.execute({
			title: "Academia JS",
			description: null,
			phone: null,
			latitude: -27.2092052,
			longitude: -49.6401091,
		})

		expect(gym.title).toBe("Academia JS")
	})
})
