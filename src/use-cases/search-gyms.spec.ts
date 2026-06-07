import { beforeEach, describe, expect, it } from "vitest"
import { InMemoryGymsRepository } from "@/repositories/in-memory/in-memory-gyms-repository.js"
import { SearchGymsUseCase } from "./search-gyms.js"

let gymsRepository: InMemoryGymsRepository
let sut: SearchGymsUseCase

beforeEach(() => {
	gymsRepository = new InMemoryGymsRepository()
	sut = new SearchGymsUseCase(gymsRepository)
})

describe("SearchGymsUseCase", () => {
	it("should return gyms matching the query", async () => {
		await gymsRepository.create({
			title: "JavaScript Gym",
			description: null,
			phone: null,
			latitude: -27.2092052,
			longitude: -49.6401091,
		})

		await gymsRepository.create({
			title: "TypeScript Gym",
			description: null,
			phone: null,
			latitude: -27.2092052,
			longitude: -49.6401091,
		})

		const { gyms } = await sut.execute({ query: "JavaScript", page: 1 })

		expect(gyms).toHaveLength(1)
		expect(gyms[0].title).toBe("JavaScript Gym")
	})

	it("should not return gyms that do not match the query", async () => {
		await gymsRepository.create({
			title: "JavaScript Gym",
			description: null,
			phone: null,
			latitude: -27.2092052,
			longitude: -49.6401091,
		})

		const { gyms } = await sut.execute({ query: "TypeScript", page: 1 })

		expect(gyms).toHaveLength(0)
	})

	it("should paginate results with 20 items per page", async () => {
		for (let i = 1; i <= 22; i++) {
			await gymsRepository.create({
				title: `Academia ${i}`,
				description: null,
				phone: null,
				latitude: -27.2092052,
				longitude: -49.6401091,
			})
		}

		const { gyms: page1 } = await sut.execute({ query: "Academia", page: 1 })
		const { gyms: page2 } = await sut.execute({ query: "Academia", page: 2 })

		expect(page1).toHaveLength(20)
		expect(page2).toHaveLength(2)
	})
})
