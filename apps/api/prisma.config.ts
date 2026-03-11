import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Make sure this matches the variable name in your .env and compose.yaml
    url: process.env.DATABASE_URL, 
  },
});