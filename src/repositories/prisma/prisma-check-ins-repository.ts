import dayjs from "dayjs";
import type { CheckIn, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import type { CheckInsRepository } from "../check-ins-repository.js";

export class PrismaCheckInsRepository implements CheckInsRepository {
	async create(data: Prisma.CheckInUncheckedCreateInput) {
		return prisma.checkIn.create({ data });
	}

	async findById(id: string) {
		return prisma.checkIn.findUnique({ where: { id } });
	}

	async save({ id, validated_at }: CheckIn) {
		return prisma.checkIn.update({ where: { id }, data: { validated_at } });
	}

	async countByUserId(userId: string) {
		return prisma.checkIn.count({ where: { user_id: userId } });
	}

	async findManyByUserId(userId: string, page: number) {
		return prisma.checkIn.findMany({
			where: { user_id: userId },
			take: 20,
			skip: (page - 1) * 20,
		});
	}

	async findByUserIdOnDate(userId: string, date: Date) {
		const startOfDay = dayjs(date).startOf("day").toDate();
		const endOfDay = dayjs(date).endOf("day").toDate();

		return prisma.checkIn.findFirst({
			where: {
				user_id: userId,
				created_at: {
					gte: startOfDay,
					lte: endOfDay,
				},
			},
		});
	}
}
