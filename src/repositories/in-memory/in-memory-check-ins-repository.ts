import { randomUUID } from "node:crypto"
import dayjs from "dayjs"
import type { CheckIn, Prisma } from "@prisma/client"
import type { CheckInsRepository } from "../check-ins-repository.js"

export class InMemoryCheckInsRepository implements CheckInsRepository {
	items: CheckIn[] = []

	async create(data: Prisma.CheckInUncheckedCreateInput) {
		const checkIn: CheckIn = {
			id: randomUUID(),
			user_id: data.user_id,
			gym_id: data.gym_id,
			validated_at: data.validated_at ? new Date(data.validated_at as string) : null,
			created_at: new Date(),
		}

		this.items.push(checkIn)

		return checkIn
	}

	async findByUserIdOnDate(userId: string, date: Date) {
		const startOfDay = dayjs(date).startOf("day").toDate()
		const endOfDay = dayjs(date).endOf("day").toDate()

		return (
			this.items.find(
				(item) =>
					item.user_id === userId &&
					item.created_at >= startOfDay &&
					item.created_at <= endOfDay,
			) ?? null
		)
	}
}
