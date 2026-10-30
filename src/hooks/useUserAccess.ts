import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApp, initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";
import { firebaseConfig } from "@/integrations/firebase/client";

export interface UserAccessRecord {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "sector";
  allowed_category_ids?: string[];
  allowed_category_names?: string[];
  created_at?: string;
  updated_at?: string;
}

export function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

/**
 * Creates a Firebase Auth user using a secondary temporary Firebase App instance
 * so that the currently logged-in Admin is NOT signed out.
 */
export async function createFirebaseUserFromAdmin(
  email: string,
  password: string
): Promise<{ createdInAuth: boolean; alreadyExisted: boolean }> {
  const tempAppName = `admin_user_creator_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  try {
    const tempAuth = getAuth(tempApp);
    await createUserWithEmailAndPassword(tempAuth, email.trim(), password);
    await signOut(tempAuth);
    return { createdInAuth: true, alreadyExisted: false };
  } catch (err: any) {
    if (err?.code === "auth/email-already-in-use") {
      return { createdInAuth: false, alreadyExisted: true };
    }
    throw err;
  } finally {
    try {
      await deleteApp(tempApp);
    } catch {
      // ignore cleanup error
    }
  }
}

export function useUserAccess() {
  const [currentEmail, setCurrentEmail] = useState<string | null>(() => {
    try {
      return getAuth(getApp()).currentUser?.email ?? null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const auth = getAuth(getApp());
      if (auth.currentUser?.email) {
        setCurrentEmail(auth.currentUser.email);
      }
      const unsub = onAuthStateChanged(auth, (u) => {
        setCurrentEmail(u?.email ?? null);
      });
      return () => unsub();
    } catch {
      return;
    }
  }, []);

  const normalizedCurrentEmail = normalizeEmail(currentEmail);

  const { data: allAccessRecords = [], isLoading: isLoadingAccess } = useQuery({
    queryKey: ["user-access-records"],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const snap = await getDocs(collection(db, "user_access"));
      return snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as UserAccessRecord)
      );
    },
  });

  const currentRecord = allAccessRecords.find(
    (r) => normalizeEmail(r.email) === normalizedCurrentEmail
  );

  const isRestricted = currentRecord?.role === "sector";
  const isAdmin = !isRestricted;

  const allowedCategoryIds = currentRecord?.allowed_category_ids ?? [];
  const allowedCategoryNames = (currentRecord?.allowed_category_names ?? []).map(
    (n) => n.trim().toLowerCase()
  );

  const canAccessCategory = (
    category?: { id?: string; name?: string } | null
  ): boolean => {
    if (isAdmin) return true;
    if (!category) return false;
    if (category.id && allowedCategoryIds.includes(category.id)) {
      return true;
    }
    if (
      category.name &&
      allowedCategoryNames.includes(category.name.trim().toLowerCase())
    ) {
      return true;
    }
    return false;
  };

  const roleLabel = isAdmin
    ? "Administrador"
    : currentRecord?.name
    ? currentRecord.name
    : (currentRecord?.allowed_category_names?.length ?? 0) > 0
    ? currentRecord?.allowed_category_names?.join(", ") ?? "Setor"
    : "Investidor";

  return {
    userEmail: currentEmail,
    normalizedEmail: normalizedCurrentEmail,
    currentRecord,
    allAccessRecords,
    isAdmin,
    isRestricted,
    isLoadingAccess,
    allowedCategoryIds,
    allowedCategoryNames,
    canAccessCategory,
    roleLabel,
  };
}
