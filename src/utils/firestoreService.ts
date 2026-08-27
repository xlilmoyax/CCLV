import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Incident, PreventiveTask, Activity, UserProfile } from '../types';

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
  authInfo: Record<string, unknown>;
}

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

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  updatedAt?: string;
}

type TableName = 'incidents' | 'preventive_tasks' | 'activities' | 'approved_workers' | 'pending_workers' | 'eddie_memories' | 'chats';
type Row = { id: string; data: Record<string, unknown> };

function throwSupabaseError(error: unknown, operationType: OperationType, path: string): never {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  throw new Error(JSON.stringify({ error: message, operationType, path, authInfo: {} }));
}

async function listTable<T>(table: TableName): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('id,data');
  if (error) throwSupabaseError(error, OperationType.GET, table);
  return (data || []).map(row => (row as Row).data as T);
}

function subscribeTable<T>(table: TableName, callback: (items: T[]) => void): () => void {
  const channel = supabase
    .channel(`${table}-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
      callback(await listTable<T>(table));
    });
  channel.subscribe();

  void listTable<T>(table).then(callback).catch(error => console.error(`Error cargando ${table}:`, error));
  return () => stopSubscription(channel);
}

function stopSubscription(channel: RealtimeChannel) {
  void supabase.removeChannel(channel);
}

async function saveRow(table: TableName, id: string, data: Record<string, unknown>) {
  const { error } = await supabase.from(table).upsert({ id, data }, { onConflict: 'id' });
  if (error) throwSupabaseError(error, OperationType.WRITE, `${table}/${id}`);
}

async function deleteRow(table: TableName, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throwSupabaseError(error, OperationType.DELETE, `${table}/${id}`);
}

export async function seedInitialDataIfEmpty() {
  // Data is created only by real users or administrators. No automatic seed data.
}

export function subscribeIncidents(callback: (incidents: Incident[]) => void) {
  return subscribeTable<Incident>('incidents', callback);
}

export function subscribePreventiveTasks(callback: (tasks: PreventiveTask[]) => void) {
  return subscribeTable<PreventiveTask>('preventive_tasks', callback);
}

export function subscribeActivities(callback: (activities: Activity[]) => void) {
  return subscribeTable<Activity>('activities', callback);
}

export function subscribeApprovedWorkers(callback: (workers: UserProfile[]) => void) {
  return subscribeTable<UserProfile>('approved_workers', callback);
}

export function subscribePendingWorkers(callback: (workers: UserProfile[]) => void) {
  return subscribeTable<UserProfile>('pending_workers', callback);
}

export function subscribeMaintenanceSettings(callback: (settings: MaintenanceSettings) => void) {
  const channel = supabase
    .channel(`maintenance-settings-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.maintenance' }, async () => {
      const { data, error } = await supabase.from('app_settings').select('data').eq('id', 'maintenance').maybeSingle();
      if (!error && data) callback(data.data as MaintenanceSettings);
    });
  channel.subscribe();

  void supabase.from('app_settings').select('data').eq('id', 'maintenance').maybeSingle()
    .then(({ data, error }) => {
      if (error) console.error('Error cargando configuración de mantenimiento:', error);
      callback((data?.data as MaintenanceSettings) || { enabled: false, message: '' });
    });
  return () => stopSubscription(channel);
}

export async function saveMaintenanceSettings(settings: MaintenanceSettings) {
  const { error } = await supabase.from('app_settings').upsert({ id: 'maintenance', data: settings }, { onConflict: 'id' });
  if (error) throwSupabaseError(error, OperationType.WRITE, 'app_settings/maintenance');
}

export function unsubscribe(channel: RealtimeChannel) {
  stopSubscription(channel);
}

export const saveIncident = (incident: Incident) => saveRow('incidents', incident.id, incident as unknown as Record<string, unknown>);
export const deleteIncident = (id: string) => deleteRow('incidents', id);
export const savePreventiveTask = (task: PreventiveTask) => saveRow('preventive_tasks', task.id, task as unknown as Record<string, unknown>);
export const saveActivity = (activity: Activity) => saveRow('activities', activity.id, activity as unknown as Record<string, unknown>);

export function saveApprovedWorker(worker: UserProfile) {
  return saveRow('approved_workers', worker.email.toLowerCase(), worker as unknown as Record<string, unknown>);
}

export function deleteApprovedWorker(email: string) {
  return deleteRow('approved_workers', email.toLowerCase());
}

export function savePendingWorker(worker: UserProfile) {
  return saveRow('pending_workers', worker.email.toLowerCase(), worker as unknown as Record<string, unknown>);
}

export function deletePendingWorker(email: string) {
  return deleteRow('pending_workers', email.toLowerCase());
}

export async function getEddieMemories(): Promise<EddieMemory[]> {
  const { data, error } = await supabase.from('eddie_memories').select('id,data');
  if (error) throwSupabaseError(error, OperationType.GET, 'eddie_memories');
  return (data || []).map(row => (row as Row).data as unknown as EddieMemory);
}

export async function learnEddieMemory(triggerQuery: string, responsePattern: string, learnedFrom: string, isCustomDialogue = false) {
  const memory: EddieMemory = {
    id: `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    triggerQuery: triggerQuery.toLowerCase().trim(),
    responsePattern,
    learnedFrom,
    createdAt: new Date().toISOString(),
    timesUsed: 0,
    isCustomDialogue
  };
  await saveRow('eddie_memories', memory.id, memory as unknown as Record<string, unknown>);
  return memory;
}

export async function saveChatSession(session: ChatSession) {
  await saveRow('chats', session.id, session as unknown as Record<string, unknown>);
}

export async function getChatSessions(userEmail: string): Promise<ChatSession[]> {
  const { data, error } = await supabase.from('chats').select('id,data');
  if (error) throwSupabaseError(error, OperationType.GET, 'chats');
  return (data || []).map(row => (row as Row).data as unknown as ChatSession)
    .filter(session => session.userEmail.toLowerCase() === userEmail.toLowerCase());
}

export async function deleteChatSession(sessionId: string) {
  await deleteRow('chats', sessionId);
}
