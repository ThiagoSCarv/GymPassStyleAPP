import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function healthRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/health",
		schema: {
			summary: "Health check",
			tags: ["health"],
			response: {
				200: z.object({ status: z.string() }),
			},
		},
		handler: async () => {
			return { status: "ok" };
		},
	});
}
