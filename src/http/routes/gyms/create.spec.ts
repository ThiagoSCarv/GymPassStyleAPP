import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "@/app.js";
import { appRoutes } from "@/http/routes.js";
import { prisma } from "@/lib/prisma.js";
import { createAndAuthenticateUser } from "@/utils/test/create-and-authenticate-user.js";

beforeAll(async () => {
	await app.register(appRoutes);
	await app.ready();
});

afterAll(async () => {
	await app.close();
});

beforeEach(async () => {
	await prisma.checkIn.deleteMany();
	await prisma.gym.deleteMany();
	await prisma.user.deleteMany();
});

describe("POST /gyms", () => {
	it("should return 201 when an admin creates a gym", async () => {
		const { token } = await createAndAuthenticateUser(app, true);

		const response = await supertest(app.server)
			.post("/gyms")
			.set("Authorization", `Bearer ${token}`)
			.send({
				title: "JavaScript Gym",
				description: "Some description.",
				phone: "1199999999",
				latitude: -27.2092052,
				longitude: -49.6401091,
			});

		expect(response.status).toBe(201);
	});

	it("should return 403 when a non-admin user tries to create a gym", async () => {
		const { token } = await createAndAuthenticateUser(app, false);

		const response = await supertest(app.server)
			.post("/gyms")
			.set("Authorization", `Bearer ${token}`)
			.send({
				title: "JavaScript Gym",
				latitude: -27.2092052,
				longitude: -49.6401091,
			});

		expect(response.status).toBe(403);
	});

	it("should return 401 when no token is provided", async () => {
		const response = await supertest(app.server).post("/gyms").send({
			title: "JavaScript Gym",
			latitude: -27.2092052,
			longitude: -49.6401091,
		});

		expect(response.status).toBe(401);
	});
});
