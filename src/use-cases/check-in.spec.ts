import type { Gym } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InMemoryCheckInsRepository } from "@/repositories/in-memory/in-memory-check-ins-repository.js"
import { InMemoryGymsRepository } from "@/repositories/in-memory/in-memory-gyms-repository.js"
import { CheckInUseCase } from "./check-in.js"
import { MaxDistanceError } from "./errors/max-distance-error.js"
import { MaxNumberOfCheckInsError } from "./errors/max-number-of-check-ins-error.js"
import { ResourceNotFoundError } from "./errors/resource-not-found-error.js"

let checkInsRepository: InMemoryCheckInsRepository
let gymsRepository: InMemoryGymsRepository
let sut: CheckInUseCase
let gym: Gym

const GYM_LATITUDE = -27.2092052
const GYM_LONGITUDE = -49.6401091

beforeEach(async () => {
	checkInsRepository = new InMemoryCheckInsRepository()
	gymsRepository = new InMemoryGymsRepository()
	sut = new CheckInUseCase(checkInsRepository, gymsRepository)

	gym = await gymsRepository.create({
		title: "Test Gym",
		latitude: GYM_LATITUDE,
		longitude: GYM_LONGITUDE,
	})

	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
})

describe("CheckInUseCase", () => {
	it("should create a check-in when user is within range", async () => {
		const { checkIn } = await sut.execute({
			userId: "user-01",
			gymId: gym.id,
			userLatitude: GYM_LATITUDE,
			userLongitude: GYM_LONGITUDE,
		})

		expect(checkIn.id).toBeTruthy()
		expect(checkIn.user_id).toBe("user-01")
		expect(checkIn.gym_id).toBe(gym.id)
	})

	it("should throw ResourceNotFoundError when gym does not exist", async () => {
		await expect(
			sut.execute({
				userId: "user-01",
				gymId: "non-existent-gym",
				userLatitude: GYM_LATITUDE,
				userLongitude: GYM_LONGITUDE,
			}),
		).rejects.toThrowError(ResourceNotFoundError)
	})

	it("should throw MaxDistanceError when user is more than 100m from gym", async () => {
		await expect(
			sut.execute({
				userId: "user-01",
				gymId: gym.id,
				userLatitude: -27.2092052,
				userLongitude: -49.6201091,
			}),
		).rejects.toThrowError(MaxDistanceError)
	})

	it("should throw MaxNumberOfCheckInsError on second check-in same day", async () => {
		vi.setSystemTime(new Date(2024, 0, 20, 8, 0, 0))

		await sut.execute({
			userId: "user-01",
			gymId: gym.id,
			userLatitude: GYM_LATITUDE,
			userLongitude: GYM_LONGITUDE,
		})

		await expect(
			sut.execute({
				userId: "user-01",
				gymId: gym.id,
				userLatitude: GYM_LATITUDE,
				userLongitude: GYM_LONGITUDE,
			}),
		).rejects.toThrowError(MaxNumberOfCheckInsError)
	})

	it("should allow check-in on a different day", async () => {
		vi.setSystemTime(new Date(2024, 0, 20, 8, 0, 0))

		await sut.execute({
			userId: "user-01",
			gymId: gym.id,
			userLatitude: GYM_LATITUDE,
			userLongitude: GYM_LONGITUDE,
		})

		vi.setSystemTime(new Date(2024, 0, 21, 8, 0, 0))

		const { checkIn } = await sut.execute({
			userId: "user-01",
			gymId: gym.id,
			userLatitude: GYM_LATITUDE,
			userLongitude: GYM_LONGITUDE,
		})

		expect(checkIn.id).toBeTruthy()
	})
})
