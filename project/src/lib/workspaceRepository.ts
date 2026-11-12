import type { ChartMetadata, StackTierInput, Workspace } from '@/types/chart';
import { normalizeStackDepth } from '@/lib/stackFile';

const STORAGE_KEY = 'preflop-gym-chart-manager:v1';
interface StoredData { version: 1; activeId: string; workspaces: Workspace[] }

function read(): StoredData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw) as StoredData;
      if (data.version === 1 && Array.isArray(data.workspaces) && data.workspaces.length) return data;
    } catch { /* Start with a clean local workspace if stored data is damaged. */ }
  }
  const workspace = makeWorkspace('Workspace 1');
  const data = { version: 1 as const, activeId: workspace.id, workspaces: [workspace] };
  write(data);
  return data;
}

function write(data: StoredData): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function makeId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function makeWorkspace(name: string, metadata?: Partial<ChartMetadata>): Workspace {
  return {
    id: makeId(), name, format: metadata?.format ?? '', tableType: metadata?.tableType ?? '',
    heroPosition: metadata?.heroPosition ?? '', situation: metadata?.situation ?? '',
    opponent: metadata?.opponent ?? 'none', extraSeats: metadata?.extraSeats ?? '',
    mttStage: metadata?.mttStage ?? '', stackTiers: [],
  };
}

export async function fetchWorkspaces(): Promise<Workspace[]> { return read().workspaces; }
export async function getActiveWorkspaceId(): Promise<string> { return read().activeId; }
export async function setActiveWorkspace(id: string): Promise<void> { const data = read(); data.activeId = id; write(data); }
export async function createWorkspace(name: string, metadata?: Partial<ChartMetadata>): Promise<string> {
  const data = read(); const workspace = makeWorkspace(name, metadata);
  data.workspaces.push(workspace); data.activeId = workspace.id; write(data); return workspace.id;
}
export async function renameWorkspace(id: string, name: string): Promise<void> {
  const data = read(); const item = data.workspaces.find((workspace) => workspace.id === id);
  if (item) item.name = name; write(data);
}
export async function updateWorkspaceMetadata(id: string, patch: Partial<ChartMetadata>): Promise<void> {
  const data = read(); const item = data.workspaces.find((workspace) => workspace.id === id);
  if (item) Object.assign(item, patch); write(data);
}
export async function upsertStackTiers(workspaceId: string, tiers: StackTierInput[]): Promise<void> {
  const data = read(); const workspace = data.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) throw new Error('Workspace not found.');
  for (const tier of tiers) {
    const depth = normalizeStackDepth(tier.stackDepth);
    const existing = workspace.stackTiers.find((item) => normalizeStackDepth(item.stackDepth) === depth);
    if (existing) throw new Error(`Stack depth ${depth}BB is already imported.`);
    if (workspace.stackTiers.length >= 25) throw new Error('A workspace can contain a maximum of 25 stack depths.');
    workspace.stackTiers.push({ ...tier, stackDepth: depth, id: makeId() });
  }
  write(data);
}
export async function deleteStackTier(id: string): Promise<void> {
  const data = read();
  for (const workspace of data.workspaces) workspace.stackTiers = workspace.stackTiers.filter((tier) => tier.id !== id);
  write(data);
}
export async function replaceAllWorkspaces(items: Array<{ name: string } & Partial<ChartMetadata> & { stackTiers: StackTierInput[] }>): Promise<void> {
  const data = read();
  const workspaces = items.map((item) => {
    if (item.stackTiers.length > 25) throw new Error('A workspace can contain a maximum of 25 stack depths.');
    const depths = item.stackTiers.map((tier) => normalizeStackDepth(tier.stackDepth));
    if (new Set(depths).size !== depths.length) throw new Error('A backup contains duplicate stack depths in one workspace.');
    const workspace = makeWorkspace(item.name, item);
    workspace.stackTiers = item.stackTiers.map((tier) => ({ ...tier, stackDepth: normalizeStackDepth(tier.stackDepth), id: makeId() }));
    return workspace;
  });
  data.workspaces = workspaces.length ? workspaces : [makeWorkspace('Workspace 1')];
  data.activeId = data.workspaces[0].id;
  write(data);
}
