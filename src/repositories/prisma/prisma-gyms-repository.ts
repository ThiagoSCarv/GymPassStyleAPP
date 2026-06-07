import { prisma } from "@/lib/prisma.js"
import type { GymsRepository } from "../gyms-repository.js"

export class PrismaGymsRepository implements GymsRepository {
	async findById(id: string) {
		return prisma.gym.findUnique({ where: { id } })
	}
}
