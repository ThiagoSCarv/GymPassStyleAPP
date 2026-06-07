import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { makeRegisterUseCase } from "@/use-cases/factories/make-register-use-case.js";
import { UserAlreadyExistsError } from "@/use-cases/errors/user-already-exists-error.js";

export async function registerRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/users",
		schema: {
			summary: "Register a new user",
			tags: ["users"],
			body: z.object({
				name: z.string(),
				email: z.string().email(),
				password: z.string().min(6),
			}),
			response: {
				201: z.null(),
				409: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { name, email, password } = request.body;

			const registerUseCase = makeRegisterUseCase();

			try {
				await registerUseCase.execute({ name, email, password });
			} catch (err) {
				if (err instanceof UserAlreadyExistsError) {
					return reply.status(409).send({ message: err.message });
				}

				throw err;
			}

			return reply.status(201).send();
		},
	});
}
