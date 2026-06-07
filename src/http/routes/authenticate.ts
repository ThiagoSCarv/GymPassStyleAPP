import type { FastifyInstance } from "fastify"
import { type ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { makeAuthenticateUseCase } from "@/use-cases/factories/make-authenticate-use-case.js"
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error.js"

export async function authenticateRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/sessions",
		schema: {
			summary: "Authenticate a user",
			tags: ["sessions"],
			body: z.object({
				email: z.string().email(),
				password: z.string().min(6),
			}),
			response: {
				200: z.object({ token: z.string() }),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { email, password } = request.body

			const authenticateUseCase = makeAuthenticateUseCase()

			try {
				const { user } = await authenticateUseCase.execute({ email, password })

				const token = await reply.jwtSign({ sub: user.id })

				return reply.status(200).send({ token })
			} catch (err) {
				if (err instanceof InvalidCredentialsError) {
					return reply.status(401).send({ message: err.message })
				}

				throw err
			}
		},
	})
}
