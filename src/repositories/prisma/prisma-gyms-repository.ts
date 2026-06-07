import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma.js"
import type { FindManyNearbyParams, GymsRepository } from "../gyms-repository.js"

export class PrismaGymsRepository implements GymsRepository {
	async searchByTitle(query: string, page: number) {
		return prisma.gym.findMany({
			where: { title: { contains: query, mode: "insensitive" } },
			take: 20,
			skip: (page - 1) * 20,
		})
	}

	async findManyNearby({ latitude, longitude }: FindManyNearbyParams) {
		const latDelta = 10 / 111
		const lngDelta = 10 / (111 * Math.cos((latitude * Math.PI) / 180))

		return prisma.gym.findMany({
			where: {
				latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
				longitude: { gte: longitude - lngDelta, lte: longitude + lngDelta },
			},
		})
	}

	async findById(id: string) {
		return prisma.gym.findUnique({ where: { id } })
	}

	async create(data: Prisma.GymCreateInput) {
		return prisma.gym.create({ data })
	}
}
