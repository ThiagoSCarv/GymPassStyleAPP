import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InMemoryCheckInsRepository } from "@/repositories/in-memory/in-memory-check-ins-repository.js"
import { ValidateCheckInUseCase } from "./validate-check-in.js"
import { ResourceNotFoundError } from "./errors/resource-not-found-error.js"
import { LateCheckInValidationError } from "./errors/late-check-in-validation-error.js"

let checkInsRepository: InMemoryCheckInsRepository
let sut: ValidateCheckInUseCase

beforeEach(() => {
	checkInsRepository = new InMemoryCheckInsRepository()
	sut = new ValidateCheckInUseCase(checkInsRepository)
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
})

describe("ValidateCheckInUseCase", () => {
	it("should validate a check-in", async () => {
		const checkIn = await checkInsRepository.create({
			user_id: randomUUID(),
			gym_id: randomUUID(),
		})

		const { checkIn: validated } = await sut.execute({ checkInId: checkIn.id })

		expect(validated.validated_at).toEqual(expect.any(Date))
		expect(checkInsRepository.items[0].validated_at).toEqual(expect.any(Date))
	})

	it("should throw ResourceNotFoundError when check-in does not exist", async () => {
		await expect(
			sut.execute({ checkInId: randomUUID() }),
		).rejects.toThrowError(ResourceNotFoundError)
	})

	it("should throw LateCheckInValidationError when check-in was created more than 20 minutes ago", async () => {
		vi.setSystemTime(new Date(2024, 0, 1, 13, 40))

		const checkIn = await checkInsRepository.create({
			user_id: randomUUID(),
			gym_id: randomUUID(),
		})

		vi.advanceTimersByTime(1000 * 60 * 21) // 21 minutes later

		await expect(
			sut.execute({ checkInId: checkIn.id }),
		).rejects.toThrowError(LateCheckInValidationError)
	})

	it("should validate a check-in within 20 minutes of creation", async () => {
		vi.setSystemTime(new Date(2024, 0, 1, 13, 40))

		const checkIn = await checkInsRepository.create({
			user_id: randomUUID(),
			gym_id: randomUUID(),
		})

		vi.advanceTimersByTime(1000 * 60 * 20) // exactly 20 minutes

		const { checkIn: validated } = await sut.execute({ checkInId: checkIn.id })

		expect(validated.validated_at).toEqual(expect.any(Date))
	})
})
