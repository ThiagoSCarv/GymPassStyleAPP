import type { FastifyInstance } from "fastify";
import { healthRoute } from "./routes/health.js";
import { authenticateRoute } from "./routes/users/authenticate.js";
import { registerRoute } from "./routes/users/register.js";

export async function appRoutes(app: FastifyInstance) {
	app.register(healthRoute);
	app.register(registerRoute);
	app.register(authenticateRoute);
}
