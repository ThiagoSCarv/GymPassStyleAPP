import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCheckInsRepository } from "@/repositories/in-memory/in-memory-check-ins-repository.js";
import { GetUserMetricsUseCase } from "./get-user-metrics.js";

let checkInsRepository: InMemoryCheckInsRepository;
let sut: GetUserMetricsUseCase;

beforeEach(() => {
	checkInsRepository = new InMemoryCheckInsRepository();
	sut = new GetUserMetricsUseCase(checkInsRepository);
});

describe("GetUserMetricsUseCase", () => {
	it("should return the total check-ins count for a user", async () => {
		const userId = randomUUID();

		await checkInsRepository.create({ user_id: userId, gym_id: randomUUID() });
		await checkInsRepository.create({ user_id: userId, gym_id: randomUUID() });
		await checkInsRepository.create({ user_id: userId, gym_id: randomUUID() });

		const { checkInsCount } = await sut.execute({ userId });

		expect(checkInsCount).toBe(3);
	});

	it("should not count check-ins from other users", async () => {
		const userId = randomUUID();
		const otherUserId = randomUUID();

		await checkInsRepository.create({ user_id: userId, gym_id: randomUUID() });
		await checkInsRepository.create({
			user_id: otherUserId,
			gym_id: randomUUID(),
		});

		const { checkInsCount } = await sut.execute({ userId });

		expect(checkInsCount).toBe(1);
	});
});
