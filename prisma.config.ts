import { defineConfig } from "prisma/config";

// No .env: point this at your own database when you connect a backend.
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: "postgresql://user:password@localhost:5432/xelectron",
  },
});
