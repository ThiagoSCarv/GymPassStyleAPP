import { PrismaGymsRepository } from "@/repositories/prisma/prisma-gyms-repository.js";
import { CreateGymUseCase } from "@/use-cases/create-gym.js";

export function makeCreateGymUseCase() {
	const gymsRepository = new PrismaGymsRepository();
	return new CreateGymUseCase(gymsRepository);
}
