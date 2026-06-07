import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository.js"
import { GetUserProfileUseCase } from "@/use-cases/get-user-profile.js"

export function makeGetUserProfileUseCase() {
	const usersRepository = new PrismaUsersRepository()
	return new GetUserProfileUseCase(usersRepository)
}
