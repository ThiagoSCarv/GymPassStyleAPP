import { randomUUID } from "node:crypto"
import { hash } from "bcryptjs"
import { beforeEach, describe, expect, it } from "vitest"
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository.js"
import { GetUserProfileUseCase } from "./get-user-profile.js"
import { ResourceNotFoundError } from "./errors/resource-not-found-error.js"

let usersRepository: InMemoryUsersRepository
let sut: GetUserProfileUseCase

beforeEach(() => {
	usersRepository = new InMemoryUsersRepository()
	sut = new GetUserProfileUseCase(usersRepository)
})

describe("GetUserProfileUseCase", () => {
	it("should return user profile when user exists", async () => {
		const created = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456", 6),
		})

		const { user } = await sut.execute({ userId: created.id })

		expect(user.id).toBe(created.id)
		expect(user.name).toBe("John Doe")
		expect(user.email).toBe("johndoe@example.com")
	})

	it("should throw ResourceNotFoundError when user does not exist", async () => {
		await expect(
			sut.execute({ userId: randomUUID() }),
		).rejects.toThrowError(ResourceNotFoundError)
	})
})
