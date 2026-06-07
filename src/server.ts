import { app } from "./app.js";
import { env } from "./env/index.js";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

app.withTypeProvider<ZodTypeProvider>().route({
	method: "GET",
	url: "/health",
	schema: {
		summary: "Health check",
		tags: ["health"],
		response: {
			200: z.object({
				status: z.string(),
			}),
		},
	},
	handler: async () => {
		return { status: "ok" };
	},
});

await app.listen({ port: env.PORT, host: "0.0.0.0" });

console.log(`🚀 Server running at http://localhost:${env.PORT}`);
console.log(`📚 Documentation available at http://localhost:${env.PORT}/docs`);
