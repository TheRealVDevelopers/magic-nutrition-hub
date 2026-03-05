import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const SUPERADMIN_EMAIL = "superadmin@mnc.com";
const SUPERADMIN_PASSWORD = "supermnc@1346";
const SUPERADMIN_DOC_ID = "superadmin_seed_check";

export async function seedSuperAdminIfNeeded(): Promise<void> {
  try {
    // Check if already seeded — bail out immediately if so
    const checkRef = doc(db, "platform", SUPERADMIN_DOC_ID);
    const checkSnap = await getDoc(checkRef);
    if (checkSnap.exists()) return;

    // Create Firebase Auth user
    const credential = await createUserWithEmailAndPassword(
      auth,
      SUPERADMIN_EMAIL,
      SUPERADMIN_PASSWORD
    );

    const uid = credential.user.uid;

    // Create Firestore user document
    await setDoc(doc(db, "superAdmins", uid), {
      name: "Super Admin",
      email: SUPERADMIN_EMAIL,
      role: "superAdmin",
      clubId: "platform",
      phone: "",
      photo: "",
      status: "active",
      createdAt: new Date(),
      createdBy: "system",
    });

    // Mark as seeded so this never runs again
    await setDoc(checkRef, {
      seededAt: new Date(),
      email: SUPERADMIN_EMAIL,
    });

    console.log("SuperAdmin seeded successfully");
  } catch (error: any) {
    // auth/email-already-in-use means the Auth user was created in a previous
    // partial run — just write the seed flag so we don't retry next time
    if (error.code === "auth/email-already-in-use") {
      try {
        const checkRef = doc(db, "platform", SUPERADMIN_DOC_ID);
        await setDoc(checkRef, {
          seededAt: new Date(),
          email: SUPERADMIN_EMAIL,
          note: "user existed already",
        });
      } catch {
        // ignore — flag will be retried on next load
      }
      return;
    }
    // All other errors (network, Firestore rules, etc.) — fail silently
    // The app continues to load normally
  }
}
