import fastifySwagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import fastify from "fastify";
import {
	jsonSchemaTransform,
	jsonSchemaTransformObject,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";

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
