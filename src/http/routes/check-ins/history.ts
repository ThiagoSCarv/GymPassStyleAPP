import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { makeFetchUserCheckInsHistoryUseCase } from "@/use-cases/factories/make-fetch-user-check-ins-history-use-case.js";

export async function fetchCheckInsHistoryRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/check-ins/history",
		schema: {
			summary: "List authenticated user check-in history",
			tags: ["check-ins"],
			querystring: z.object({
				page: z.coerce.number().min(1).default(1),
			}),
			response: {
				200: z.object({
					checkIns: z.array(
						z.object({
							id: z.string(),
							user_id: z.string(),
							gym_id: z.string(),
							validated_at: z.date().nullable(),
							created_at: z.date(),
						}),
					),
				}),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { sub: userId } = request.user;
			const { page } = request.query;

			const fetchHistoryUseCase = makeFetchUserCheckInsHistoryUseCase();

			const { checkIns } = await fetchHistoryUseCase.execute({ userId, page });

			return reply.status(200).send({ checkIns });
		},
	});
}
