import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
	PORT: z.coerce.number().default(3000),
	DATABASE_URL: z.url(),
	JWT_SECRET: z.string().min(1),
});

const { data, error } = envSchema.safeParse(process.env);

if (error) {
	console.error("Invalid environment variables:", error.flatten().fieldErrors);
	process.exit(1);
}

export const env = data;
