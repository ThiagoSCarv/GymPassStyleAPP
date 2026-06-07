import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "node",
		setupFiles: ["./vitest.setup.ts"],
		fileParallelism: false,
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.spec.ts", "src/server.ts", "src/env/index.ts", "src/lib/prisma.ts"],
		},
	},
})
