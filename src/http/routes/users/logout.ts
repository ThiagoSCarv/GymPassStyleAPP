import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function logoutRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/sessions",
		schema: {
			summary: "Logout user",
			tags: ["sessions"],
			response: {
				200: z.object({}),
			},
		},
		handler: async (_request, reply) => {
			return reply
				.clearCookie("refreshToken", { path: "/" })
				.status(200)
				.send({});
		},
	});
}
