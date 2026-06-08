import { randomUUID } from "node:crypto";
import { Prisma, type Gym } from "@prisma/client";
import type {
	FindManyNearbyParams,
	GymsRepository,
} from "../gyms-repository.js";
import { getDistanceBetweenCoordinates } from "@/utils/get-distance-between-coordinates.js";

export class InMemoryGymsRepository implements GymsRepository {
	items: Gym[] = [];

	async searchByTitle(query: string, page: number) {
		return this.items
			.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
			.slice((page - 1) * 20, page * 20);
	}

	async findManyNearby({ latitude, longitude }: FindManyNearbyParams) {
		return this.items.filter((item) => {
			const distance = getDistanceBetweenCoordinates(
				{ latitude, longitude },
				{
					latitude: item.latitude.toNumber(),
					longitude: item.longitude.toNumber(),
				},
			);
			return distance <= 10;
		});
	}

	async findById(id: string) {
		return this.items.find((item) => item.id === id) ?? null;
	}

	async create(data: Prisma.GymCreateInput) {
		const gym: Gym = {
			id: randomUUID(),
			title: data.title,
			description: data.description ?? null,
			phone: data.phone ?? null,
			latitude: new Prisma.Decimal(data.latitude),
			longitude: new Prisma.Decimal(data.longitude),
		};

		this.items.push(gym);

		return gym;
	}
}
