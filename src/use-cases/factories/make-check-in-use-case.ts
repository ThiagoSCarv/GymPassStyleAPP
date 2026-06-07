import { PrismaCheckInsRepository } from "@/repositories/prisma/prisma-check-ins-repository.js"
import { PrismaGymsRepository } from "@/repositories/prisma/prisma-gyms-repository.js"
import { CheckInUseCase } from "@/use-cases/check-in.js"

export function makeCheckInUseCase() {
	const checkInsRepository = new PrismaCheckInsRepository()
	const gymsRepository = new PrismaGymsRepository()
	return new CheckInUseCase(checkInsRepository, gymsRepository)
}
