import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "@/app.js";
import { appRoutes } from "@/http/routes.js";
import { prisma } from "@/lib/prisma.js";

beforeAll(async () => {
	await app.register(appRoutes);
	await app.ready();
});

afterAll(async () => {
	await app.close();
});

beforeEach(async () => {
	await prisma.user.deleteMany();
});

describe("POST /users", () => {
	it("should create a new user and return 201", async () => {
		const response = await supertest(app.server).post("/users").send({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		});

		expect(response.status).toBe(201);
	});

	it("should return 409 when email is already in use", async () => {
		const body = {
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123456",
		};

		await supertest(app.server).post("/users").send(body);

		const response = await supertest(app.server).post("/users").send(body);

		expect(response.status).toBe(409);
		expect(response.body).toMatchObject({ message: "E-mail already in use." });
	});

	it("should return 400 when email format is invalid", async () => {
		const response = await supertest(app.server).post("/users").send({
			name: "John Doe",
			email: "not-an-email",
			password: "123456",
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 when password has fewer than 6 characters", async () => {
		const response = await supertest(app.server).post("/users").send({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "123",
		});

		expect(response.status).toBe(400);
	});
});
