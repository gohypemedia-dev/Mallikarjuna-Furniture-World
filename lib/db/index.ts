/**
 * Database stand-in. No database, no DATABASE_URL: every model call resolves with an empty result so pages,
 * API routes, controllers and DAL files keep their structure but fetch no data.
 * Replace this file with a real client (e.g. Prisma) when a backend is connected.
 */
const asyncValue = <T,>(value: T) => Promise.resolve(value);

const methodDefaults: Record<string, (args: any) => unknown> = {
  findMany: () => [],
  findFirst: () => null,
  findUnique: () => null,
  findFirstOrThrow: () => null,
  findUniqueOrThrow: () => null,
  count: () => 0,
  aggregate: () => ({ _count: 0, _sum: {}, _avg: {}, _min: {}, _max: {} }),
  groupBy: () => [],
  create: (args) => ({ id: "stub", ...(args?.data ?? {}) }),
  update: (args) => ({ id: "stub", ...(args?.where ?? {}), ...(args?.data ?? {}) }),
  upsert: (args) => ({ id: "stub", ...(args?.create ?? {}) }),
  delete: (args) => ({ id: "stub", ...(args?.where ?? {}) }),
  createMany: () => ({ count: 0 }),
  updateMany: () => ({ count: 0 }),
  deleteMany: () => ({ count: 0 }),
};

function createModel() {
  return new Proxy(
    {},
    {
      get(_t, method: string) {
        const fallback = methodDefaults[method] ?? (() => null);
        return (args?: unknown) => asyncValue(fallback(args));
      },
    }
  );
}

function createStubClient(): any {
  const models = new Map<string, unknown>();
  const client: any = new Proxy(
    {},
    {
      get(_t, prop: string | symbol) {
        if (typeof prop !== "string" || prop === "then") return undefined;
        if (prop === "$transaction") {
          return (arg: unknown) =>
            typeof arg === "function" ? (arg as (tx: unknown) => unknown)(client) : Promise.all(arg as unknown[]);
        }
        if (prop === "$queryRaw" || prop === "$queryRawUnsafe") return () => asyncValue([]);
        if (prop === "$executeRaw" || prop === "$executeRawUnsafe") return () => asyncValue(0);
        if (prop.startsWith("$")) return () => asyncValue(undefined);
        if (!models.has(prop)) models.set(prop, createModel());
        return models.get(prop);
      },
    }
  );
  return client;
}

export function createPrismaClient(): any {
  return createStubClient();
}

export const db: any = createStubClient();
