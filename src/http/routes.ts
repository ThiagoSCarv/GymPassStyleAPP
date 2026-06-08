import type { FastifyInstance } from "fastify";
import { healthRoute } from "./routes/health.js";
import { createGymRoute } from "./routes/gyms/create.js";
import { authenticateRoute } from "./routes/users/authenticate.js";
import { profileRoute } from "./routes/users/profile.js";
import { registerRoute } from "./routes/users/register.js";
import { verifyJwt } from "./middlewares/verify-jwt.js";
import { verifyUserRole } from "./middlewares/verify-user-role.js";

export async function appRoutes(app: FastifyInstance) {
	app.register(healthRoute);
	app.register(registerRoute);
	app.register(authenticateRoute);

	app.register(async (protectedApp) => {
		protectedApp.addHook("onRequest", verifyJwt);
		protectedApp.register(profileRoute);

		protectedApp.register(async (adminApp) => {
			adminApp.addHook("onRequest", verifyUserRole("ADMIN"));
			adminApp.register(createGymRoute);
		});
	});
}
