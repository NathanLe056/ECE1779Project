import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
    // The ".." tells Prisma to look one folder up for the prisma directory
    schema: "../prisma/schema.prisma",
    migrations: {
        path: "../prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
