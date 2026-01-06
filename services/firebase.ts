
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, writeBatch, where, Timestamp } from 'firebase/firestore';
import { Hen, EggLog, Expense } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAB5f3D3IDRN7UYf7SvMp5YEjdVGG2Zuz4",
  authDomain: "alexaistudio.firebaseapp.com",
  projectId: "alexaistudio",
  storageBucket: "alexaistudio.appspot.com",
  messagingSenderId: "192808989938",
  appId: "1:192808989938:web:3bf8e6e2727e590c0d4c6b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper functions
export const hensRef = collection(db, 'hens');
export const eggLogsRef = collection(db, 'egg_logs');
export const expensesRef = collection(db, 'expenses');

/**
 * Fetch all hens, strictly mapping Document ID.
 */
export const getHens = async (): Promise<Hen[]> => {
  const snapshot = await getDocs(query(hensRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (data.createdAt || Date.now());
    
    return {
      id: docSnapshot.id,
      name: data.name || 'Unnamed Hen',
      breed: data.breed || 'Heritage',
      age: data.age || '1',
      color: data.color || '#FDF5E6',
      createdAt: createdAt,
    };
  });
};

/**
 * Fetch all egg logs.
 */
export const getEggLogs = async (): Promise<EggLog[]> => {
  const snapshot = await getDocs(query(eggLogsRef, orderBy('timestamp', 'desc')));
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : (Number(data.timestamp) || Date.now());

    return {
      id: docSnapshot.id,
      henId: data.henId || '',
      henName: data.henName || 'Unknown Hen',
      weight: Number(data.weight) || 0,
      quantity: Number(data.quantity) || 1,
      timestamp: timestamp,
    };
  });
};

/**
 * Fetch all expenses.
 */
export const getExpenses = async (): Promise<Expense[]> => {
  const snapshot = await getDocs(query(expensesRef, orderBy('timestamp', 'desc')));
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      category: data.category,
      amount: Number(data.amount) || 0,
      date: data.date,
      timestamp: data.timestamp || Date.now(),
    };
  });
};

export const addExpense = async (data: Omit<Expense, 'id'>) => {
  return await addDoc(expensesRef, data);
};

export const deleteExpense = async (id: string) => {
  await deleteDoc(doc(db, 'expenses', id));
};

export const updateHen = async (id: string, data: { name: string, age: string | number, color: string, breed: string }) => {
  if (!id) throw new Error("Missing ID for updateHen");
  const henDoc = doc(db, 'hens', id);
  await updateDoc(henDoc, data);
};

export const updateEggLogDetailed = async (id: string, data: { weight: number, quantity: number, timestamp: number }) => {
  if (!id) throw new Error("Missing ID for updateEggLogDetailed");
  const logDoc = doc(db, 'egg_logs', id);
  await updateDoc(logDoc, {
    weight: Number(data.weight),
    quantity: Number(data.quantity),
    timestamp: data.timestamp 
  });
};

export const deleteEggLog = async (id: string) => {
  if (!id) throw new Error("Missing ID for deleteEggLog");
  const logDoc = doc(db, 'egg_logs', id);
  await deleteDoc(logDoc);
};

// Added clearAllEggLogs to fix export error in HistoryView.tsx
export const clearAllEggLogs = async () => {
  const snapshot = await getDocs(eggLogsRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach(docSnap => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
};

export const deleteHenAndLogs = async (henId: string) => {
  if (!henId) throw new Error("Missing ID for deleteHenAndLogs");
  const batch = writeBatch(db);
  const henDoc = doc(db, 'hens', henId);
  batch.delete(henDoc);
  const logsQuery = query(eggLogsRef, where('henId', '==', henId));
  const logsSnapshot = await getDocs(logsQuery);
  logsSnapshot.docs.forEach(logDoc => {
    batch.delete(logDoc.ref);
  });
  await batch.commit();
};
