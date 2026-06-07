import { app } from "./app.js";
import { env } from "./env/index.js";
import { appRoutes } from "./http/routes.js";

await app.register(appRoutes);

await app.listen({ port: env.PORT, host: "0.0.0.0" });

console.log(`🚀 Server running at http://localhost:${env.PORT}`);
console.log(`📚 Documentation available at http://localhost:${env.PORT}/docs`);
