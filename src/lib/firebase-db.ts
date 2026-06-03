import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { Tables } from "@/integrations/supabase/types";
import { firestore, firebaseReady } from "@/integrations/firebase/client";

type YearRow = Tables<"years">;
type CategoryRow = Tables<"categories">;
type ProductRow = Tables<"products">;
type PurchaseRow = Tables<"purchases">;

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

function getDb() {
  if (!firestore) throw new Error("Firebase não configurado. Verifique as variáveis VITE_FIREBASE_*");
  return firestore;
}

export const firebaseDbReady = firebaseReady && Boolean(firestore);

export const firebaseDb = {
  async getYears() {
    const db = getDb();
    const snapshot = await getDocs(collection(db, "years"));
    return snapshot.docs
      .map((d) => d.data() as YearRow)
      .sort((a, b) => b.year - a.year);
  },

  async getYear(yearId: string) {
    const db = getDb();
    const ref = doc(db, "years", yearId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as YearRow) : null;
  },

  async createYear(input: { year: number; total_budget: number }) {
    const db = getDb();
    const id = makeId("year");
    const row: YearRow = {
      id,
      created_at: nowIso(),
      user_id: DEV_USER_ID,
      year: input.year,
      total_budget: input.total_budget,
    };

    await setDoc(doc(db, "years", id), row);
    return row;
  },

  async updateYearBudget(yearId: string, totalBudget: number) {
    const db = getDb();
    await updateDoc(doc(db, "years", yearId), { total_budget: totalBudget });
  },

  async deleteYear(yearId: string) {
    const db = getDb();
    const batch = writeBatch(db);

    const categoriesSnap = await getDocs(query(collection(db, "categories"), where("year_id", "==", yearId)));
    const categoryIds = categoriesSnap.docs.map((d) => d.id);

    categoriesSnap.forEach((d) => batch.delete(d.ref));

    const productsSnap = await getDocs(collection(db, "products"));
    productsSnap.forEach((d) => {
      const data = d.data() as ProductRow;
      if (categoryIds.includes(data.category_id)) {
        batch.delete(d.ref);
      }
    });

    const purchasesSnap = await getDocs(query(collection(db, "purchases"), where("year_id", "==", yearId)));
    purchasesSnap.forEach((d) => batch.delete(d.ref));

    batch.delete(doc(db, "years", yearId));
    await batch.commit();
  },

  async getCategoriesByYear(yearId: string) {
    const db = getDb();
    const snapshot = await getDocs(query(collection(db, "categories"), where("year_id", "==", yearId)));
    return snapshot.docs
      .map((d) => d.data() as CategoryRow)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async upsertCategory(input: {
    id?: string;
    year_id: string;
    name: string;
    budget: number;
    color: string;
  }) {
    const db = getDb();
    if (input.id) {
      await updateDoc(doc(db, "categories", input.id), {
        name: input.name,
        budget: input.budget,
        color: input.color,
      });
      return;
    }

    const id = makeId("cat");
    const row: CategoryRow = {
      id,
      created_at: nowIso(),
      icon: null,
      user_id: DEV_USER_ID,
      year_id: input.year_id,
      name: input.name,
      budget: input.budget,
      color: input.color,
    };
    await setDoc(doc(db, "categories", id), row);
  },

  async deleteCategory(categoryId: string) {
    const db = getDb();
    const batch = writeBatch(db);

    const productsSnap = await getDocs(query(collection(db, "products"), where("category_id", "==", categoryId)));
    productsSnap.forEach((d) => batch.delete(d.ref));

    const purchasesSnap = await getDocs(query(collection(db, "purchases"), where("category_id", "==", categoryId)));
    purchasesSnap.forEach((d) => batch.delete(d.ref));

    batch.delete(doc(db, "categories", categoryId));
    await batch.commit();
  },

  async getCategoryWithYear(categoryId: string) {
    const db = getDb();
    const categorySnap = await getDoc(doc(db, "categories", categoryId));
    if (!categorySnap.exists()) return null;

    const category = categorySnap.data() as CategoryRow;
    const yearSnap = await getDoc(doc(db, "years", category.year_id));
    const year = yearSnap.exists() ? (yearSnap.data() as YearRow) : null;

    return {
      ...category,
      years: year ? { year: year.year } : null,
    };
  },

  async getProductsByCategory(categoryId: string) {
    const db = getDb();
    const snapshot = await getDocs(query(collection(db, "products"), where("category_id", "==", categoryId)));
    return snapshot.docs
      .map((d) => d.data() as ProductRow)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async upsertProduct(input: { id?: string; category_id: string; name: string; budget: number }) {
    const db = getDb();
    if (input.id) {
      await updateDoc(doc(db, "products", input.id), {
        name: input.name,
        budget: input.budget,
      });
      return;
    }

    const id = makeId("prod");
    const row: ProductRow = {
      id,
      created_at: nowIso(),
      user_id: DEV_USER_ID,
      category_id: input.category_id,
      name: input.name,
      budget: input.budget,
    };
    await setDoc(doc(db, "products", id), row);
  },

  async deleteProduct(productId: string) {
    const db = getDb();
    const batch = writeBatch(db);

    const purchasesSnap = await getDocs(query(collection(db, "purchases"), where("product_id", "==", productId)));
    purchasesSnap.forEach((d) => batch.delete(d.ref));

    batch.delete(doc(db, "products", productId));
    await batch.commit();
  },

  async getPurchasesByYear(yearId: string) {
    const db = getDb();
    const snapshot = await getDocs(query(collection(db, "purchases"), where("year_id", "==", yearId)));
    return snapshot.docs.map((d) => d.data() as PurchaseRow);
  },

  async getPurchasesByCategory(categoryId: string) {
    const db = getDb();
    const purchasesSnap = await getDocs(query(collection(db, "purchases"), where("category_id", "==", categoryId)));
    const productsSnap = await getDocs(collection(db, "products"));
    const productById = new Map(productsSnap.docs.map((d) => {
      const data = d.data() as ProductRow;
      return [data.id, data];
    }));

    return purchasesSnap.docs
      .map((d) => d.data() as PurchaseRow)
      .sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))
      .map((p) => ({
        ...p,
        products: p.product_id ? { name: productById.get(p.product_id)?.name ?? null } : null,
      }));
  },

  async getAllPurchasesWithCategory() {
    const db = getDb();
    const purchasesSnap = await getDocs(collection(db, "purchases"));
    const categoriesSnap = await getDocs(collection(db, "categories"));
    const categoryById = new Map(categoriesSnap.docs.map((d) => {
      const data = d.data() as CategoryRow;
      return [data.id, data];
    }));

    return purchasesSnap.docs
      .map((d) => d.data() as PurchaseRow)
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
    const db = getDb();
    if (input.id) {
      await updateDoc(doc(db, "purchases", input.id), {
        amount: input.amount,
        purchase_date: input.purchase_date,
        notes: input.notes,
        product_id: input.product_id,
      });
      return;
    }

    const id = makeId("purch");
    const row: PurchaseRow = {
      id,
      created_at: nowIso(),
      user_id: DEV_USER_ID,
      year_id: input.year_id,
      category_id: input.category_id,
      amount: input.amount,
      purchase_date: input.purchase_date,
      notes: input.notes,
      product_id: input.product_id,
    };
    await setDoc(doc(db, "purchases", id), row);
  },

  async deletePurchase(purchaseId: string) {
    const db = getDb();
    await deleteDoc(doc(db, "purchases", purchaseId));
  },
};
