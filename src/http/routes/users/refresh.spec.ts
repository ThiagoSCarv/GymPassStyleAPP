import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import supertest from "supertest"
import { app } from "@/app.js"
import { appRoutes } from "@/http/routes.js"
import { prisma } from "@/lib/prisma.js"

beforeAll(async () => {
  await app.register(appRoutes)
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  await prisma.user.deleteMany()
})

describe("POST /sessions/refresh", () => {
  it("should return 200 and a new access token when refresh cookie is valid", async () => {
    await supertest(app.server).post("/users").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    })

    const authResponse = await supertest(app.server).post("/sessions").send({
      email: "johndoe@example.com",
      password: "123456",
    })

    const setCookieHeader = authResponse.headers["set-cookie"] as string[] | string
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="))!

    const response = await supertest(app.server)
      .post("/sessions/refresh")
      .set("Cookie", refreshCookie)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ token: expect.any(String) })
  })

  it("should return 401 when no refresh cookie is present", async () => {
    const response = await supertest(app.server).post("/sessions/refresh")

    expect(response.status).toBe(401)
  })

  it("should return 401 when refresh cookie contains a corrupted token", async () => {
    const response = await supertest(app.server)
      .post("/sessions/refresh")
      .set("Cookie", "refreshToken=invalid.token.here")

    expect(response.status).toBe(401)
  })

  it("should return 401 when cookie contains an access token instead of refresh token", async () => {
    await supertest(app.server).post("/users").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    })

    const authResponse = await supertest(app.server).post("/sessions").send({
      email: "johndoe@example.com",
      password: "123456",
    })

    const { token: accessToken } = authResponse.body as { token: string }

    const response = await supertest(app.server)
      .post("/sessions/refresh")
      .set("Cookie", `refreshToken=${accessToken}`)

    expect(response.status).toBe(401)
  })
})
