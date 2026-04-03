import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const databaseUrl =
  process.env.DATABASE_URL ||
  (process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_NAME &&
  `${process.env.DB_HOST ? `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME}?schema=public` : ""}`) ||
  undefined;

console.log("DATABASE_URL found:", !!databaseUrl);

export default defineConfig({
  schema: "../prisma/schema.prisma", 
  migrations: {
    path: "../prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});