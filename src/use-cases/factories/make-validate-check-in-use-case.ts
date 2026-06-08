import { PrismaCheckInsRepository } from "@/repositories/prisma/prisma-check-ins-repository.js";
import { ValidateCheckInUseCase } from "@/use-cases/validate-check-in.js";

export function makeValidateCheckInUseCase() {
	const checkInsRepository = new PrismaCheckInsRepository();
	return new ValidateCheckInUseCase(checkInsRepository);
}
