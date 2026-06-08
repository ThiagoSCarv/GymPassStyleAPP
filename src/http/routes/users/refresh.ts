import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function refreshRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/sessions/refresh",
		schema: {
			summary: "Refresh access token",
			tags: ["sessions"],
			response: {
				200: z.object({ token: z.string() }),
				401: z.object({ message: z.string() }),
			},
		},
		handler: async (request, reply) => {
			const refreshToken = request.cookies?.refreshToken;

			if (!refreshToken) {
				return reply.status(401).send({ message: "Unauthorized." });
			}

			try {
				const decoded = app.jwt.verify<{
					sub: string;
					role: "ADMIN" | "MEMBER";
				}>(refreshToken, { allowedAud: "refresh" });

				if (!decoded.sub || typeof decoded.sub !== "string") {
					return reply.status(401).send({ message: "Unauthorized." });
				}

				const token = await reply.jwtSign(
					{ role: decoded.role },
					{ sign: { sub: decoded.sub, expiresIn: "1h", aud: "access" } },
				);

				return reply.status(200).send({ token });
			} catch {
				return reply.status(401).send({ message: "Unauthorized." });
			}
		},
	});
}
