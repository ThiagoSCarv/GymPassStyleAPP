import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { makeCreateGymUseCase } from "@/use-cases/factories/make-create-gym-use-case.js";

export async function createGymRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/gyms",
		schema: {
			summary: "Create a new gym",
			tags: ["gyms"],
			body: z.object({
				title: z.string(),
				description: z.string().nullable().default(null),
				phone: z.string().nullable().default(null),
				latitude: z.coerce.number().refine((value) => Math.abs(value) <= 90),
				longitude: z.coerce.number().refine((value) => Math.abs(value) <= 180),
			}),
			response: {
				201: z.null(),
				401: z.object({ message: z.string() }),
				403: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { title, description, phone, latitude, longitude } = request.body;

			const createGymUseCase = makeCreateGymUseCase();

			await createGymUseCase.execute({
				title,
				description,
				phone,
				latitude,
				longitude,
			});

			return reply.status(201).send();
		},
	});
}
