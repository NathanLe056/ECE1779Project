import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";
// 1. Look one level up from 'src' to find '.env' in 'apps/api/'
dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("DATABASE_URL found:", !!process.env.DATABASE_URL);
export default defineConfig({
    // 2. Look one level up from 'src' to find the 'prisma' folder
    schema: "../prisma/schema.prisma",
    migrations: {
        path: "../prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
