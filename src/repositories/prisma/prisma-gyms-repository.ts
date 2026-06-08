import type { Gym, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import type {
	FindManyNearbyParams,
	GymsRepository,
} from "../gyms-repository.js";

export class PrismaGymsRepository implements GymsRepository {
	async searchByTitle(query: string, page: number) {
		return prisma.gym.findMany({
			where: { title: { contains: query, mode: "insensitive" } },
			take: 20,
			skip: (page - 1) * 20,
		});
	}

	async findManyNearby({ latitude, longitude }: FindManyNearbyParams) {
		const latDelta = 10 / 111;
		const lngDelta = 10 / (111 * Math.cos((latitude * Math.PI) / 180));

		return prisma.$queryRaw<Gym[]>`
			SELECT * FROM gyms
			WHERE latitude  BETWEEN ${latitude - latDelta} AND ${latitude + latDelta}
			  AND longitude BETWEEN ${longitude - lngDelta} AND ${longitude + lngDelta}
			  AND (
			    6371 * acos(
			        cos(radians(${latitude})) * cos(radians(latitude)) *
			        cos(radians(longitude) - radians(${longitude})) +
			        sin(radians(${latitude})) * sin(radians(latitude))
			    )
			  ) <= 10
		`;
	}

	async findById(id: string) {
		return prisma.gym.findUnique({ where: { id } });
	}

	async create(data: Prisma.GymCreateInput) {
		return prisma.gym.create({ data });
	}
}
