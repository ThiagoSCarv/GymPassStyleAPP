import type { Prisma } from "@prisma/client";
import type { GymsRepository } from "@/repositories/gyms-repository.js";

type CreateGymUseCaseRequest = Prisma.GymCreateInput;

export class CreateGymUseCase {
	constructor(private gymsRepository: GymsRepository) {}

	async execute(data: CreateGymUseCaseRequest) {
		const gym = await this.gymsRepository.create(data);

		return { gym };
	}
}
