import type { FastifyInstance } from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeValidateCheckInUseCase } from "@/use-cases/factories/make-validate-check-in-use-case.js"
import { LateCheckInValidationError } from "@/use-cases/errors/late-check-in-validation-error.js"
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error.js"

export async function validateCheckInRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "PATCH",
		url: "/check-ins/:checkInId/validate",
		schema: {
			summary: "Validate a check-in (admin only)",
			tags: ["check-ins"],
			params: z.object({
				checkInId: z.string(),
			}),
			response: {
				200: z.object({
					checkIn: z.object({
						id: z.string(),
						user_id: z.string(),
						gym_id: z.string(),
						validated_at: z.date().nullable(),
						created_at: z.date(),
					}),
				}),
				400: z.object({ message: z.string() }),
				401: z.object({ message: z.string() }),
				403: z.object({ message: z.string() }),
				404: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { checkInId } = request.params

			const validateCheckInUseCase = makeValidateCheckInUseCase()

			try {
				const { checkIn } = await validateCheckInUseCase.execute({ checkInId })

				return reply.status(200).send({ checkIn })
			} catch (err) {
				if (err instanceof ResourceNotFoundError) {
					return reply.status(404).send({ message: err.message })
				}
				if (err instanceof LateCheckInValidationError) {
					return reply.status(400).send({ message: err.message })
				}
				throw err
			}
		},
	})
}
