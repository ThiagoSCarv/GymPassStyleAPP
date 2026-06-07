import { compare } from "bcryptjs"
import { beforeEach, describe, expect, it } from "vitest"
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository.js"
import { RegisterUseCase } from "./register.js"
import { UserAlreadyExistsError } from "./errors/user-already-exists-error.js"

let usersRepository: InMemoryUsersRepository
let sut: RegisterUseCase

beforeEach(() => {
	usersRepository = new InMemoryUsersRepository()
	sut = new RegisterUseCase(usersRepository)
})

describe("RegisterUseCase", () => {
	it("should register a new user", async () => {
		const { user } = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		})

		expect(user.id).toBeTruthy()
	})

	it("should hash the password on registration", async () => {
		const { user } = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		})

		const isPasswordCorrectlyHashed = await compare("123456", user.password_hash)

		expect(isPasswordCorrectlyHashed).toBe(true)
	})

	it("should throw UserAlreadyExistsError when email is already taken", async () => {
		const email = "johndoe@example.com"

		await sut.execute({ name: "John Doe", email, password: "123456" })

		await expect(
			sut.execute({ name: "John Doe", email, password: "123456" }),
		).rejects.toThrowError(UserAlreadyExistsError)
	})
})
