import { randomUUID } from "node:crypto"
import { Prisma, type Gym } from "@prisma/client"
import type { GymsRepository } from "../gyms-repository.js"

export class InMemoryGymsRepository implements GymsRepository {
	items: Gym[] = []

	async findById(id: string) {
		return this.items.find((item) => item.id === id) ?? null
	}

	async create(data: {
		title: string
		description?: string | null
		phone?: string | null
		latitude: number
		longitude: number
	}) {
		const gym: Gym = {
			id: randomUUID(),
			title: data.title,
			description: data.description ?? null,
			phone: data.phone ?? null,
			latitude: new Prisma.Decimal(data.latitude),
			longitude: new Prisma.Decimal(data.longitude),
		}

		this.items.push(gym)

		return gym
	}
}
