import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { makeCheckInUseCase } from "@/use-cases/factories/make-check-in-use-case.js";
import { MaxDistanceError } from "@/use-cases/errors/max-distance-error.js";
import { MaxNumberOfCheckInsError } from "@/use-cases/errors/max-number-of-check-ins-error.js";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error.js";

export async function checkInRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/gyms/:gymId/check-ins",
		schema: {
			summary: "Check in at a gym",
			tags: ["check-ins"],
			params: z.object({
				gymId: z.string(),
			}),
			body: z.object({
				latitude: z.number().refine((v) => Math.abs(v) <= 90),
				longitude: z.number().refine((v) => Math.abs(v) <= 180),
			}),
			response: {
				201: z.null(),
				400: z.object({ message: z.string() }),
				401: z.object({ message: z.string() }),
				404: z.object({ message: z.string() }),
				409: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const { gymId } = request.params;
			const { latitude, longitude } = request.body;
			const { sub: userId } = request.user;

			const checkInUseCase = makeCheckInUseCase();

			try {
				await checkInUseCase.execute({
					userId,
					gymId,
					userLatitude: latitude,
					userLongitude: longitude,
				});

				return reply.status(201).send();
			} catch (err) {
				if (err instanceof ResourceNotFoundError) {
					return reply.status(404).send({ message: err.message });
				}
				if (err instanceof MaxDistanceError) {
					return reply.status(400).send({ message: err.message });
				}
				if (err instanceof MaxNumberOfCheckInsError) {
					return reply.status(409).send({ message: err.message });
				}
				throw err;
			}
		},
	});
}
