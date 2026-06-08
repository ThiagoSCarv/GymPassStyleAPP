import { randomUUID } from "node:crypto";
import type { Prisma, User } from "@prisma/client";
import type { UsersRepository } from "../users-repository.js";

export class InMemoryUsersRepository implements UsersRepository {
	items: User[] = [];

	async findById(id: string) {
		return this.items.find((user) => user.id === id) ?? null;
	}

	async findByEmail(email: string) {
		return this.items.find((user) => user.email === email) ?? null;
	}

	async create(data: Prisma.UserCreateInput) {
		const user: User = {
			id: randomUUID(),
			name: data.name,
			email: data.email,
			password_hash: data.password_hash as string,
			role: "MEMBER",
			created_at: new Date(),
		};

		this.items.push(user);

		return user;
	}
}
