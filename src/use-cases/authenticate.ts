import { compare } from "bcryptjs";
import type { UsersRepository } from "@/repositories/users-repository.js";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error.js";

interface AuthenticateUseCaseRequest {
	email: string;
	password: string;
}

export class AuthenticateUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute({ email, password }: AuthenticateUseCaseRequest) {
		const user = await this.usersRepository.findByEmail(email);

		if (!user) {
			throw new InvalidCredentialsError();
		}

		const passwordMatches = await compare(password, user.password_hash);

		if (!passwordMatches) {
			throw new InvalidCredentialsError();
		}

		return { user };
	}
}
