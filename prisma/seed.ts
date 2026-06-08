import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const gyms = [
	{
		title: "Iron House Academia",
		description: "Academia completa com musculação e cardio",
		phone: "(11) 3322-1100",
		latitude: -23.5505,
		longitude: -46.6333,
	},
	{
		title: "SmartFit Paulista",
		description: "Unidade na Av. Paulista com horário estendido",
		phone: "(11) 3045-9900",
		latitude: -23.5629,
		longitude: -46.6544,
	},
	{
		title: "CrossFit República",
		description: "Box de CrossFit com coaches certificados",
		phone: "(11) 3224-7788",
		latitude: -23.5435,
		longitude: -46.6388,
	},
	{
		title: "Bodytech Jardins",
		description: "Academia premium com piscina e spa",
		phone: "(11) 3064-2200",
		latitude: -23.5710,
		longitude: -46.6680,
	},
	{
		title: "Bluefit Moema",
		description: "Academia com foco em bem-estar e qualidade de vida",
		phone: "(11) 5093-4400",
		latitude: -23.6012,
		longitude: -46.6661,
	},
]

async function main() {
	console.log("Seeding database...")

	await prisma.checkIn.deleteMany()
	await prisma.user.deleteMany()
	await prisma.gym.deleteMany()

	const adminPasswordHash = await hash("admin123", 6)
	const memberPasswordHash = await hash("member123", 6)

	const admin = await prisma.user.create({
		data: {
			name: "Admin",
			email: "admin@gymapp.com",
			password_hash: adminPasswordHash,
			role: "ADMIN",
		},
	})

	const member1 = await prisma.user.create({
		data: {
			name: "João Silva",
			email: "joao@gymapp.com",
			password_hash: memberPasswordHash,
			role: "MEMBER",
		},
	})

	const member2 = await prisma.user.create({
		data: {
			name: "Maria Souza",
			email: "maria@gymapp.com",
			password_hash: memberPasswordHash,
			role: "MEMBER",
		},
	})

	const createdGyms = await Promise.all(
		gyms.map((gym) => prisma.gym.create({ data: gym })),
	)

	await prisma.checkIn.createMany({
		data: [
			{
				user_id: member1.id,
				gym_id: createdGyms[0].id,
				validated_at: new Date(),
			},
			{
				user_id: member1.id,
				gym_id: createdGyms[1].id,
				validated_at: new Date(),
			},
			{
				user_id: member2.id,
				gym_id: createdGyms[0].id,
				validated_at: new Date(),
			},
			{
				user_id: member2.id,
				gym_id: createdGyms[2].id,
			},
		],
	})

	console.log(`✓ ${await prisma.user.count()} users created`)
	console.log(`  admin@gymapp.com     / admin123  (ADMIN)`)
	console.log(`  joao@gymapp.com      / member123 (MEMBER)`)
	console.log(`  maria@gymapp.com     / member123 (MEMBER)`)
	console.log(`✓ ${await prisma.gym.count()} gyms created`)
	console.log(`✓ ${await prisma.checkIn.count()} check-ins created`)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
