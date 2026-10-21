// scripts/migrate-tests.js
// This script migrates all exams (tests) from the old Google‑login teacher profile
// to the new email/password teacher profile. It is idempotent – running it twice
// will not create duplicate exams.
// Usage: set environment variable FIREBASE_SERVICE_ACCOUNT_JSON with your service account JSON string,
// then run `node scripts/migrate-tests.js`.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, collection, doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import path from 'path';

// ---- UPDATE THESE VALUES ----
const OLD_EMAIL = 'teacher@example.com';        // same email for old & new profile
const OLD_GOOGLE_UID = 'OLD_GOOGLE_UID';       // UID of the Google‑login account
const NEW_EMAIL = 'teacher@example.com';        // email for the new account (same as above)
const NEW_PASSWORD = 'ReplaceWithSecurePwd123'; // if the email/password user does not exist, it will be created
// -----------------------------

// Initialise Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const auth = getAuth();

async function migrate() {
  // 1️⃣ Ensure the new email/password user exists and obtain its UID
  let newUserRecord;
  try {
    newUserRecord = await auth.getUserByEmail(NEW_EMAIL);
    console.log('✅ Existing email/password user found');
  } catch (e) {
    console.log('🔧 Creating new email/password user');
    newUserRecord = await auth.createUser({ email: NEW_EMAIL, password: NEW_PASSWORD });
  }
  const newUid = newUserRecord.uid;

  // 2️⃣ Load backup file produced by backup-teacher-tests.js
  const backupPath = path.resolve('backup', 'old-teacher-tests.json');
  const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));

  const batch = writeBatch(db);
  let copiedExams = 0;

  // 3️⃣ Copy each exam, preserving its original document ID (so share links stay the same)
  for (const exam of backup.exams) {
    const examRef = doc(db, 'exams', exam.id);
    const existing = await getDoc(examRef);
    if (existing.exists) {
      const data = existing.data();
      // If it already belongs to the new teacher, skip – idempotent
      if (data.teacherName === NEW_EMAIL || data.teacherId === newUid) {
        console.log(`↺ Exam ${exam.id} already migrated – skipping`);
        continue;
      }
    }
    // Build the new exam document – replace only the teacher identifier fields
    const newExamData = {
      ...exam,
      teacherId: newUid,
      teacherName: NEW_EMAIL,
      // Keep original createdAt if present; otherwise set server timestamp
      createdAt: exam.createdAt || serverTimestamp(),
    };
    batch.set(examRef, newExamData);
    copiedExams++;
  }

  // 4️⃣ Copy student_results (they reference the same exam IDs, so no changes needed)
  for (const result of backup.studentResults) {
    const resultRef = doc(db, 'student_results', result.id);
    const exists = await getDoc(resultRef);
    if (!exists.exists) {
      batch.set(resultRef, result);
    }
  }

  // 5️⃣ Commit batch
  await batch.commit();
  console.log(`✅ Migration completed – ${copiedExams} exams copied, ${backup.studentResults.length} results ensured.`);
}

migrate().catch(err => {
  console.error('⚠️ Migration failed:', err);
});
