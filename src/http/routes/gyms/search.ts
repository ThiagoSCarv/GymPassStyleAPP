import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { makeSearchGymsUseCase } from "@/use-cases/factories/make-search-gyms-use-case.js";

export async function searchGymsRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/gyms/search",
		schema: {
			summary: "Search gyms by title",
			tags: ["gyms"],
			querystring: z.object({
				q: z.string(),
				page: z.coerce.number().min(1).default(1),
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
			const { q, page } = request.query;

			const searchGymsUseCase = makeSearchGymsUseCase();

			const { gyms } = await searchGymsUseCase.execute({ query: q, page });

			return reply.status(200).send({ gyms });
		},
	});
}
