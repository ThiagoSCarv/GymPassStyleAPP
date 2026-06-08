import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryGymsRepository } from "@/repositories/in-memory/in-memory-gyms-repository.js";
import { FetchNearbyGymsUseCase } from "./fetch-nearby-gyms.js";

let gymsRepository: InMemoryGymsRepository;
let sut: FetchNearbyGymsUseCase;

beforeEach(() => {
	gymsRepository = new InMemoryGymsRepository();
	sut = new FetchNearbyGymsUseCase(gymsRepository);
});

describe("FetchNearbyGymsUseCase", () => {
	it("should return gyms within 10km", async () => {
		await gymsRepository.create({
			title: "Academia Próxima",
			description: null,
			phone: null,
			latitude: -27.2092052,
			longitude: -49.6401091,
		});

		await gymsRepository.create({
			title: "Academia Distante",
			description: null,
			phone: null,
			latitude: -27.9191879,
			longitude: -49.4400544,
		});

		const { gyms } = await sut.execute({
			userLatitude: -27.2092052,
			userLongitude: -49.6401091,
		});

		expect(gyms).toHaveLength(1);
		expect(gyms[0].title).toBe("Academia Próxima");
	});

	it("should not return gyms farther than 10km", async () => {
		await gymsRepository.create({
			title: "Academia Distante",
			description: null,
			phone: null,
			latitude: -27.9191879,
			longitude: -49.4400544,
		});

		const { gyms } = await sut.execute({
			userLatitude: -27.2092052,
			userLongitude: -49.6401091,
		});

		expect(gyms).toHaveLength(0);
	});
});
