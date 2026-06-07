import { hash } from "bcryptjs"
import { beforeEach, describe, expect, it } from "vitest"
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository.js"
import { AuthenticateUseCase } from "./authenticate.js"
import { InvalidCredentialsError } from "./errors/invalid-credentials-error.js"

let usersRepository: InMemoryUsersRepository
let sut: AuthenticateUseCase

beforeEach(() => {
	usersRepository = new InMemoryUsersRepository()
	sut = new AuthenticateUseCase(usersRepository)
})

describe("AuthenticateUseCase", () => {
	it("should authenticate with correct credentials", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456", 6),
		})

		const { user } = await sut.execute({
			email: "johndoe@example.com",
			password: "123456",
		})

		expect(user.id).toBeTruthy()
	})

	it("should throw InvalidCredentialsError when email is not found", async () => {
		await expect(
			sut.execute({ email: "nonexistent@example.com", password: "123456" }),
		).rejects.toThrowError(InvalidCredentialsError)
	})

	it("should throw InvalidCredentialsError when password is wrong", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			password_hash: await hash("123456", 6),
		})

		await expect(
			sut.execute({ email: "johndoe@example.com", password: "wrong-password" }),
		).rejects.toThrowError(InvalidCredentialsError)
	})
})
