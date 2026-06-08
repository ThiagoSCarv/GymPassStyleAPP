import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { makeFetchNearbyGymsUseCase } from "@/use-cases/factories/make-fetch-nearby-gyms-use-case.js";

export async function fetchNearbyGymsRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/gyms/nearby",
		schema: {
			summary: "Fetch gyms near the user",
			tags: ["gyms"],
			querystring: z.object({
				latitude: z.coerce.number().refine((value) => Math.abs(value) <= 90),
				longitude: z.coerce.number().refine((value) => Math.abs(value) <= 180),
			}),
			response: {
				200: z.object({
					gyms: z.array(
						z.object({
							id: z.string(),
							title: z.string(),
							description: z.string().nullable(),
							phone: z.string().nullable(),
							latitude: z.coerce.number(),
							longitude: z.coerce.number(),
						}),
					),
				}),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { latitude, longitude } = request.query;

			const fetchNearbyGymsUseCase = makeFetchNearbyGymsUseCase();

			const { gyms } = await fetchNearbyGymsUseCase.execute({
				userLatitude: latitude,
				userLongitude: longitude,
			});

			return reply.status(200).send({ gyms });
		},
	});
}
