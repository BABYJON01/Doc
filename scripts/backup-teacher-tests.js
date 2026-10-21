// scripts/backup-teacher-tests.js
// This script backs up all exams (tests) and related student results for a given teacher.
// Usage: set environment variable FIREBASE_SERVICE_ACCOUNT_JSON with your service account JSON string,
// then run `node scripts/backup-teacher-tests.js`.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// ---- UPDATE THESE VALUES ----
const OLD_EMAIL = 'teacher@example.com'; // replace with the teacher's email (same for old and new profile)
const OLD_GOOGLE_UID = 'OLD_GOOGLE_UID'; // replace with the UID of the Google‑login account
// -----------------------------

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function backupTests() {
  // 1️⃣ Exams belonging to the old teacher (by UID or by email)
  const examsRef = collection(db, 'exams');
  const qUid = query(examsRef, where('teacherId', '==', OLD_GOOGLE_UID));
  const qEmail = query(examsRef, where('teacherName', '==', OLD_EMAIL));

  const [snapUid, snapEmail] = await Promise.all([getDocs(qUid), getDocs(qEmail)]);
  const exams = [...snapUid.docs, ...snapEmail.docs].map(d => ({ id: d.id, ...d.data() }));

  // 2️⃣ Student results for those exams
  const resultsRef = collection(db, 'student_results');
  const resultPromises = exams.map(e => getDocs(query(resultsRef, where('examId', '==', e.id))));
  const resultsSnaps = await Promise.all(resultPromises);
  const results = resultsSnaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })));

  // 3️⃣ Teacher document (optional, for reference)
  const teacherSnap = await getDocs(query(collection(db, 'teachers'), where('email', '==', OLD_EMAIL)));
  const teacherDoc = teacherSnap.empty ? null : { id: teacherSnap.docs[0].id, ...teacherSnap.docs[0].data() };

  // 4️⃣ Write to backup file
  const backup = { teacher: teacherDoc, exams, studentResults: results };
  const outDir = path.resolve('backup');
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'old-teacher-tests.json');
  writeFileSync(outFile, JSON.stringify(backup, null, 2));

  console.log(`✅ Backup written to ${outFile}`);
  console.log(`   Exams: ${exams.length}`);
  console.log(`   Student results: ${results.length}`);
}

backupTests().catch(err => {
  console.error('Backup failed:', err);
});
