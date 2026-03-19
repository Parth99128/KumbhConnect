import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KUMBH_MELA_MEETING_POINTS = [
  {
    name: "Sangam Point - Main Ghat",
    description: "Primary meeting point at the confluence of Ganga, Yamuna, and Saraswati",
    latitude: 25.4268,
    longitude: 81.8857,
    type: "PREDEFINED" as const,
  },
  {
    name: "Sector 1 - Police Post",
    description: "Near Sector 1 police booth, well-lit area with medical aid",
    latitude: 25.4310,
    longitude: 81.8820,
    type: "PREDEFINED" as const,
  },
  {
    name: "Sector 4 - Lost & Found Center",
    description: "Official lost & found center with PA system",
    latitude: 25.4350,
    longitude: 81.8890,
    type: "PREDEFINED" as const,
  },
  {
    name: "Parade Ground Gate",
    description: "Main entry gate, large open area with clear landmarks",
    latitude: 25.4400,
    longitude: 81.8800,
    type: "PREDEFINED" as const,
  },
  {
    name: "Railway Station Parking",
    description: "Prayagraj Junction railway station parking area",
    latitude: 25.4278,
    longitude: 81.8490,
    type: "PREDEFINED" as const,
  },
  {
    name: "Kali Marg - Medical Camp",
    description: "24/7 medical emergency camp with helicopter pad",
    latitude: 25.4320,
    longitude: 81.8850,
    type: "EMERGENCY" as const,
  },
  {
    name: "Triveni Ghat Clock Tower",
    description: "Tall clock tower visible from distance, easy landmark",
    latitude: 25.4289,
    longitude: 81.8870,
    type: "LANDMARK" as const,
  },
  {
    name: "Bus Terminal - Naini Bridge",
    description: "Bus terminal near Naini Bridge, well connected area",
    latitude: 25.4200,
    longitude: 81.8950,
    type: "PREDEFINED" as const,
  },
  {
    name: "Sector 7 - Volunteer Kiosk",
    description: "Volunteer kiosk with QR scanning and phone charging",
    latitude: 25.4380,
    longitude: 81.8860,
    type: "PREDEFINED" as const,
  },
  {
    name: "Akshayavat Temple Gate",
    description: "Famous temple gate, major landmark in Kumbh area",
    latitude: 25.4310,
    longitude: 81.8900,
    type: "LANDMARK" as const,
  },
];

async function seed() {
  console.log("Seeding predefined meeting points...");

  for (const point of KUMBH_MELA_MEETING_POINTS) {
    await prisma.meetingPoint.upsert({
      where: {
        id: `seed-${point.name.toLowerCase().replace(/\s+/g, "-")}`.slice(0, 25),
      },
      update: {},
      create: {
        name: point.name,
        description: point.description,
        latitude: point.latitude,
        longitude: point.longitude,
        type: point.type,
      },
    });
  }

  console.log(`Seeded ${KUMBH_MELA_MEETING_POINTS.length} meeting points.`);
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
