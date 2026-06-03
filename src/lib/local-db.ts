import type { Tables } from "@/integrations/supabase/types";

type YearRow = Tables<"years">;
type CategoryRow = Tables<"categories">;
type ProductRow = Tables<"products">;
type PurchaseRow = Tables<"purchases">;

type LocalDbShape = {
  years: YearRow[];
  categories: CategoryRow[];
  products: ProductRow[];
  purchases: PurchaseRow[];
};

const STORAGE_KEY = "verdance.localdb.v1";
const DEV_USER_ID = "dev-user";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyDb(): LocalDbShape {
  return {
    years: [],
    categories: [],
    products: [],
    purchases: [],
  };
}

function readDb(): LocalDbShape {
  if (typeof window === "undefined") return emptyDb();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyDb();

  try {
    const parsed = JSON.parse(raw) as Partial<LocalDbShape>;
    return {
      years: parsed.years ?? [],
      categories: parsed.categories ?? [],
      products: parsed.products ?? [],
      purchases: parsed.purchases ?? [],
    };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: LocalDbShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const localDb = {
  async getYears() {
    const db = readDb();
    return [...db.years].sort((a, b) => b.year - a.year);
  },

  async getYear(yearId: string) {
    const db = readDb();
    return db.years.find((y) => y.id === yearId) ?? null;
  },

  async createYear(input: { year: number; total_budget: number }) {
    const db = readDb();
    const row: YearRow = {
      id: makeId("year"),
      created_at: nowIso(),
      user_id: DEV_USER_ID,
      year: input.year,
      total_budget: input.total_budget,
    };

    db.years.push(row);
    writeDb(db);
    return row;
  },

  async updateYearBudget(yearId: string, totalBudget: number) {
    const db = readDb();
    db.years = db.years.map((y) => (y.id === yearId ? { ...y, total_budget: totalBudget } : y));
    writeDb(db);
  },

  async deleteYear(yearId: string) {
    const db = readDb();
    const categoryIds = db.categories.filter((c) => c.year_id === yearId).map((c) => c.id);

    db.years = db.years.filter((y) => y.id !== yearId);
    db.categories = db.categories.filter((c) => c.year_id !== yearId);
    db.products = db.products.filter((p) => !categoryIds.includes(p.category_id));
    db.purchases = db.purchases.filter((p) => p.year_id !== yearId);

    writeDb(db);
  },

  async getCategoriesByYear(yearId: string) {
    const db = readDb();
    return db.categories
      .filter((c) => c.year_id === yearId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async upsertCategory(input: {
    id?: string;
    year_id: string;
    name: string;
    budget: number;
    color: string;
  }) {
    const db = readDb();

    if (input.id) {
      db.categories = db.categories.map((c) =>
        c.id === input.id
          ? {
              ...c,
              name: input.name,
              budget: input.budget,
              color: input.color,
            }
          : c,
      );
      writeDb(db);
      return;
    }

    const row: CategoryRow = {
      id: makeId("cat"),
      created_at: nowIso(),
      icon: null,
      user_id: DEV_USER_ID,
      year_id: input.year_id,
      name: input.name,
      budget: input.budget,
      color: input.color,
    };

    db.categories.push(row);
    writeDb(db);
  },

  async deleteCategory(categoryId: string) {
    const db = readDb();
    const productIds = db.products.filter((p) => p.category_id === categoryId).map((p) => p.id);

    db.categories = db.categories.filter((c) => c.id !== categoryId);
    db.products = db.products.filter((p) => p.category_id !== categoryId);
    db.purchases = db.purchases.filter(
      (p) => p.category_id !== categoryId && (!p.product_id || !productIds.includes(p.product_id)),
    );

    writeDb(db);
  },

  async getCategoryWithYear(categoryId: string) {
    const db = readDb();
    const category = db.categories.find((c) => c.id === categoryId);
    if (!category) return null;

    const year = db.years.find((y) => y.id === category.year_id);
    return {
      ...category,
      years: year ? { year: year.year } : null,
    };
  },

  async getProductsByCategory(categoryId: string) {
    const db = readDb();
    return db.products
      .filter((p) => p.category_id === categoryId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async upsertProduct(input: { id?: string; category_id: string; name: string; budget: number }) {
    const db = readDb();

    if (input.id) {
      db.products = db.products.map((p) =>
        p.id === input.id
          ? {
              ...p,
              name: input.name,
              budget: input.budget,
            }
          : p,
      );
      writeDb(db);
      return;
    }

    const row: ProductRow = {
      id: makeId("prod"),
      created_at: nowIso(),
      user_id: DEV_USER_ID,
      category_id: input.category_id,
      name: input.name,
      budget: input.budget,
    };

    db.products.push(row);
    writeDb(db);
  },

  async deleteProduct(productId: string) {
    const db = readDb();
    db.products = db.products.filter((p) => p.id !== productId);
    db.purchases = db.purchases.filter((p) => p.product_id !== productId);
    writeDb(db);
  },

  async getPurchasesByYear(yearId: string) {
    const db = readDb();
    return db.purchases.filter((p) => p.year_id === yearId);
  },

  async getPurchasesByCategory(categoryId: string) {
    const db = readDb();
    const productById = new Map(db.products.map((p) => [p.id, p]));

    return db.purchases
      .filter((p) => p.category_id === categoryId)
      .sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))
      .map((p) => ({
        ...p,
        products: p.product_id ? { name: productById.get(p.product_id)?.name ?? null } : null,
      }));
  },

  async getAllPurchasesWithCategory() {
    const db = readDb();
    const categoryById = new Map(db.categories.map((c) => [c.id, c]));

    return [...db.purchases]
      .sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))
      .map((p) => ({
        ...p,
        categories: (() => {
          const c = categoryById.get(p.category_id);
          if (!c) return null;
          return { name: c.name, color: c.color };
        })(),
      }));
  },

  async upsertPurchase(input: {
    id?: string;
    year_id: string;
    category_id: string;
    amount: number;
    purchase_date: string;
    notes: string | null;
    product_id: string | null;
  }) {
    const db = readDb();

    if (input.id) {
      db.purchases = db.purchases.map((p) =>
        p.id === input.id
          ? {
              ...p,
              amount: input.amount,
              purchase_date: input.purchase_date,
              notes: input.notes,
              product_id: input.product_id,
            }
          : p,
      );
      writeDb(db);
      return;
    }

    const row: PurchaseRow = {
      id: makeId("purch"),
      created_at: nowIso(),
      user_id: DEV_USER_ID,
      year_id: input.year_id,
      category_id: input.category_id,
      amount: input.amount,
      purchase_date: input.purchase_date,
      notes: input.notes,
      product_id: input.product_id,
    };

    db.purchases.push(row);
    writeDb(db);
  },

  async deletePurchase(purchaseId: string) {
    const db = readDb();
    db.purchases = db.purchases.filter((p) => p.id !== purchaseId);
    writeDb(db);
  },
};
