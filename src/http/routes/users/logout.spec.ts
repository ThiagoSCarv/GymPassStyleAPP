import { afterAll, beforeAll, describe, expect, it } from "vitest"
import supertest from "supertest"
import { app } from "@/app.js"
import { appRoutes } from "@/http/routes.js"

beforeAll(async () => {
  await app.register(appRoutes)
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe("DELETE /sessions", () => {
  it("should return 200 and clear the refreshToken cookie", async () => {
    const response = await supertest(app.server).delete("/sessions")

    expect(response.status).toBe(200)

    const setCookieHeader = response.headers["set-cookie"] as string[] | string
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    expect(cookies.some((c) => c.includes("refreshToken=;"))).toBe(true)
  })
})
