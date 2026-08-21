import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Incident, PreventiveTask, Activity, UserProfile } from '../types';
import { INITIAL_INCIDENTS, INITIAL_PREVENTIVE_TASKS, INITIAL_ACTIVITIES } from '../data';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Custom Eddie memory types
export interface EddieMemory {
  id: string;
  triggerQuery: string;
  responsePattern: string;
  learnedFrom: string;
  createdAt: string;
  timesUsed: number;
  isCustomDialogue: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'eddie';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userEmail: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Seed initial mock data if database is empty on boot
 */
export async function seedInitialDataIfEmpty() {
  try {
    // 1. Incidents
    const incSnapshot = await getDocs(collection(db, 'incidents'));
    if (incSnapshot.empty) {
      console.log('Seeding initial incidents...');
      for (const inc of INITIAL_INCIDENTS) {
        await setDoc(doc(db, 'incidents', inc.id), inc);
      }
    }

    // 2. Preventive Tasks
    const prevSnapshot = await getDocs(collection(db, 'preventive_tasks'));
    if (prevSnapshot.empty) {
      console.log('Seeding initial preventive tasks...');
      for (const task of INITIAL_PREVENTIVE_TASKS) {
        await setDoc(doc(db, 'preventive_tasks', task.id), task);
      }
    }

    // 3. Activities
    const actSnapshot = await getDocs(collection(db, 'activities'));
    if (actSnapshot.empty) {
      console.log('Seeding initial activities...');
      for (const act of INITIAL_ACTIVITIES) {
        await setDoc(doc(db, 'activities', act.id), act);
      }
    }

    // 4. Approved Workers
    const approvedSnapshot = await getDocs(collection(db, 'approved_workers'));
    if (approvedSnapshot.empty) {
      console.log('Seeding initial approved workers...');
      const defaultWorker: UserProfile = {
        name: 'Carlos Martínez',
        document: '35.912.045',
        phone: '3764-551122',
        email: 'carlos.martinez@oficina.com',
        office: 'Jóvenes',
        isApproved: true
      };
      await setDoc(doc(db, 'approved_workers', defaultWorker.email.toLowerCase()), defaultWorker);
    }

    // 5. Pending Workers
    const pendingSnapshot = await getDocs(collection(db, 'pending_workers'));
    if (pendingSnapshot.empty) {
      console.log('Seeding initial pending workers...');
      const defaultPendings: UserProfile[] = [
        {
          name: 'Roberto Gómez',
          document: '38.452.193',
          phone: '3764-981244',
          email: 'roberto.gomez@oficina.com',
          office: 'Misiones',
          isApproved: false
        },
        {
          name: 'Lucía Benítez',
          document: '40.129.852',
          phone: '3764-152288',
          email: 'lucia.benitez@oficina.com',
          office: 'Kinectika',
          isApproved: false
        }
      ];
      for (const p of defaultPendings) {
        await setDoc(doc(db, 'pending_workers', p.email.toLowerCase()), p);
      }
    }
  } catch (error) {
    console.error('Error during Firestore seeding:', error);
  }
}

// --- SUBSCRIPTIONS FOR REAL-TIME SYNC ---

export function subscribeIncidents(callback: (incidents: Incident[]) => void) {
  return onSnapshot(collection(db, 'incidents'), (snapshot) => {
    const list: Incident[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Incident);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'incidents');
  });
}

export function subscribePreventiveTasks(callback: (tasks: PreventiveTask[]) => void) {
  return onSnapshot(collection(db, 'preventive_tasks'), (snapshot) => {
    const list: PreventiveTask[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as PreventiveTask);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'preventive_tasks');
  });
}

export function subscribeActivities(callback: (activities: Activity[]) => void) {
  return onSnapshot(collection(db, 'activities'), (snapshot) => {
    const list: Activity[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Activity);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'activities');
  });
}

export function subscribeApprovedWorkers(callback: (workers: UserProfile[]) => void) {
  return onSnapshot(collection(db, 'approved_workers'), (snapshot) => {
    const list: UserProfile[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as UserProfile);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'approved_workers');
  });
}

export function subscribePendingWorkers(callback: (workers: UserProfile[]) => void) {
  return onSnapshot(collection(db, 'pending_workers'), (snapshot) => {
    const list: UserProfile[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as UserProfile);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'pending_workers');
  });
}

// --- MUTATION WRAPPERS ---

export async function saveIncident(incident: Incident) {
  const path = `incidents/${incident.id}`;
  try {
    await setDoc(doc(db, 'incidents', incident.id), incident);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteIncident(id: string) {
  const path = `incidents/${id}`;
  try {
    await deleteDoc(doc(db, 'incidents', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePreventiveTask(task: PreventiveTask) {
  const path = `preventive_tasks/${task.id}`;
  try {
    await setDoc(doc(db, 'preventive_tasks', task.id), task);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveActivity(activity: Activity) {
  const path = `activities/${activity.id}`;
  try {
    await setDoc(doc(db, 'activities', activity.id), activity);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveApprovedWorker(worker: UserProfile) {
  const emailLower = worker.email.toLowerCase();
  const path = `approved_workers/${emailLower}`;
  try {
    await setDoc(doc(db, 'approved_workers', emailLower), worker);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteApprovedWorker(email: string) {
  const emailLower = email.toLowerCase();
  const path = `approved_workers/${emailLower}`;
  try {
    await deleteDoc(doc(db, 'approved_workers', emailLower));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePendingWorker(worker: UserProfile) {
  const emailLower = worker.email.toLowerCase();
  const path = `pending_workers/${emailLower}`;
  try {
    await setDoc(doc(db, 'pending_workers', emailLower), worker);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePendingWorker(email: string) {
  const emailLower = email.toLowerCase();
  const path = `pending_workers/${emailLower}`;
  try {
    await deleteDoc(doc(db, 'pending_workers', emailLower));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- EDDIE MEMORIES & LEARNED DIALOGUES ---

export async function getEddieMemories(): Promise<EddieMemory[]> {
  try {
    const snap = await getDocs(collection(db, 'eddie_memories'));
    const list: EddieMemory[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as EddieMemory);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'eddie_memories');
    return [];
  }
}

export async function learnEddieMemory(triggerQuery: string, responsePattern: string, learnedFrom: string, isCustomDialogue = false) {
  const cleanTrigger = triggerQuery.toLowerCase().trim();
  const id = `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `eddie_memories/${id}`;
  
  const memory: EddieMemory = {
    id,
    triggerQuery: cleanTrigger,
    responsePattern,
    learnedFrom,
    createdAt: new Date().toISOString(),
    timesUsed: 0,
    isCustomDialogue
  };

  try {
    await setDoc(doc(db, 'eddie_memories', id), memory);
    console.log(`Eddie learned new pattern for query: "${triggerQuery}"`);
    return memory;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- CHAT SESSIONS & HISTORICAL CHATS ---

export async function saveChatSession(session: ChatSession) {
  const path = `chats/${session.id}`;
  try {
    await setDoc(doc(db, 'chats', session.id), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getChatSessions(userEmail: string): Promise<ChatSession[]> {
  try {
    const snap = await getDocs(collection(db, 'chats'));
    const list: ChatSession[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as ChatSession;
      if (data.userEmail.toLowerCase() === userEmail.toLowerCase()) {
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'chats');
    return [];
  }
}
