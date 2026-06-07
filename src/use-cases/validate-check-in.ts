import type { CheckIn } from "@prisma/client"
import dayjs from "dayjs"
import type { CheckInsRepository } from "@/repositories/check-ins-repository.js"
import { ResourceNotFoundError } from "./errors/resource-not-found-error.js"
import { LateCheckInValidationError } from "./errors/late-check-in-validation-error.js"

const MAX_VALIDATION_TIME_IN_MINUTES = 20

interface ValidateCheckInUseCaseRequest {
	checkInId: string
}

interface ValidateCheckInUseCaseResponse {
	checkIn: CheckIn
}

export class ValidateCheckInUseCase {
	constructor(private checkInsRepository: CheckInsRepository) {}

	async execute({
		checkInId,
	}: ValidateCheckInUseCaseRequest): Promise<ValidateCheckInUseCaseResponse> {
		const checkIn = await this.checkInsRepository.findById(checkInId)

		if (!checkIn) {
			throw new ResourceNotFoundError()
		}

		const minutesSinceCreation = dayjs(new Date()).diff(checkIn.created_at, "minute")

		if (minutesSinceCreation > MAX_VALIDATION_TIME_IN_MINUTES) {
			throw new LateCheckInValidationError()
		}

		checkIn.validated_at = new Date()

		return { checkIn: await this.checkInsRepository.save(checkIn) }
	}
}
