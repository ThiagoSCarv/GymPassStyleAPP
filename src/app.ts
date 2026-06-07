import fastifySwagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import fastify from "fastify";
import {
	jsonSchemaTransform,
	jsonSchemaTransformObject,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "./env/index.js";

export const app = fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Solid Node API",
			description: "API documentation",
			version: "1.0.0",
		},
	},
	transform: jsonSchemaTransform,
	transformObject: jsonSchemaTransformObject,
});

await app.register(ScalarApiReference, {
	routePrefix: "/docs",
});

app.setErrorHandler((error, _request, reply) => {
	if (env.NODE_ENV === "development") {
		console.error(error);
	}

	// TODO: log to error tracking service in production (Datadog, New Relic, Sentry, etc.)

	if (error.statusCode) {
		return reply.status(error.statusCode).send({ message: error.message });
	}

	return reply.status(500).send({ message: "Internal server error." });
});
