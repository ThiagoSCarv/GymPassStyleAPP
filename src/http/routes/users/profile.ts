import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { makeGetUserProfileUseCase } from "@/use-cases/factories/make-get-user-profile-use-case.js";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error.js";

export async function profileRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/me",
		schema: {
			summary: "Get authenticated user profile",
			tags: ["users"],
			response: {
				200: z.object({
					user: z.object({
						id: z.string(),
						name: z.string(),
						email: z.string(),
						role: z.enum(["ADMIN", "MEMBER"]),
						created_at: z.date(),
					}),
				}),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { sub: userId } = request.user;

			const getUserProfile = makeGetUserProfileUseCase();

			try {
				const { user } = await getUserProfile.execute({ userId });

				const { password_hash: _, ...userWithoutPassword } = user;

				return reply.status(200).send({ user: userWithoutPassword });
			} catch (err) {
				if (err instanceof ResourceNotFoundError) {
					return reply.status(404).send({ message: err.message });
				}

				throw err;
			}
		},
	});
}
