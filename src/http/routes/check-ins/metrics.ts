import type { FastifyInstance } from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeGetUserMetricsUseCase } from "@/use-cases/factories/make-get-user-metrics-use-case.js"

export async function getUserMetricsRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/check-ins/metrics",
		schema: {
			summary: "Get authenticated user total check-in count",
			tags: ["check-ins"],
			response: {
				200: z.object({
					checkInsCount: z.number(),
				}),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { sub: userId } = request.user

			const getMetricsUseCase = makeGetUserMetricsUseCase()

			const { checkInsCount } = await getMetricsUseCase.execute({ userId })

			return reply.status(200).send({ checkInsCount })
		},
	})
}
