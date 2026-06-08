import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCheckInsRepository } from "@/repositories/in-memory/in-memory-check-ins-repository.js";
import { FetchUserCheckInsHistoryUseCase } from "./fetch-user-check-ins-history.js";

let checkInsRepository: InMemoryCheckInsRepository;
let sut: FetchUserCheckInsHistoryUseCase;

beforeEach(() => {
	checkInsRepository = new InMemoryCheckInsRepository();
	sut = new FetchUserCheckInsHistoryUseCase(checkInsRepository);
});

describe("FetchUserCheckInsHistoryUseCase", () => {
	it("should return all check-ins for a given user", async () => {
		const userId = randomUUID();

		await checkInsRepository.create({ user_id: userId, gym_id: randomUUID() });
		await checkInsRepository.create({ user_id: userId, gym_id: randomUUID() });

		const { checkIns } = await sut.execute({ userId, page: 1 });

		expect(checkIns).toHaveLength(2);
		expect(checkIns).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ user_id: userId }),
				expect.objectContaining({ user_id: userId }),
			]),
		);
	});

	it("should not return check-ins from other users", async () => {
		const userId = randomUUID();
		const otherUserId = randomUUID();

		await checkInsRepository.create({ user_id: userId, gym_id: randomUUID() });
		await checkInsRepository.create({
			user_id: otherUserId,
			gym_id: randomUUID(),
		});

		const { checkIns } = await sut.execute({ userId, page: 1 });

		expect(checkIns).toHaveLength(1);
		expect(checkIns[0].user_id).toBe(userId);
	});

	it("should paginate results with 20 items per page", async () => {
		const userId = randomUUID();

		for (let i = 0; i < 22; i++) {
			await checkInsRepository.create({
				user_id: userId,
				gym_id: randomUUID(),
			});
		}

		const { checkIns: page1 } = await sut.execute({ userId, page: 1 });
		const { checkIns: page2 } = await sut.execute({ userId, page: 2 });

		expect(page1).toHaveLength(20);
		expect(page2).toHaveLength(2);
	});
});
