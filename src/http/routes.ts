import type { FastifyInstance } from "fastify";
import { healthRoute } from "./routes/health.js";
import { registerRoute } from "./routes/register.js";

export async function appRoutes(app: FastifyInstance) {
	app.register(healthRoute);
	app.register(registerRoute);
}
