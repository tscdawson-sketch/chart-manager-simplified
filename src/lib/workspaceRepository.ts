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

function cloneTier(tier: StackTierInput, id = makeId()) {
  return {
    ...tier,
    stackDepth: normalizeStackDepth(tier.stackDepth),
    ranges: {
      fold: [...tier.ranges.fold],
      call: [...tier.ranges.call],
      all_in: [...tier.ranges.all_in],
      raise: [...tier.ranges.raise],
      raise_2: [...tier.ranges.raise_2],
      raise_3: [...tier.ranges.raise_3],
    },
    sizings: { ...tier.sizings },
    mixedStrategies: { ...tier.mixedStrategies },
    id,
  };
}

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
  const data = read();
  const workspace = makeWorkspace(name, metadata);
  data.workspaces.push(workspace);
  data.activeId = workspace.id;
  write(data);
  return workspace.id;
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
  const data = read();
  const item = data.workspaces.find((workspace) => workspace.id === id);
  if (item) item.name = name;
  write(data);
}

export async function updateWorkspaceMetadata(id: string, patch: Partial<ChartMetadata>): Promise<void> {
  const data = read();
  const item = data.workspaces.find((workspace) => workspace.id === id);
  if (item) Object.assign(item, patch);
  write(data);
}

export async function upsertStackTiers(
  workspaceId: string,
  tiers: StackTierInput[],
  replaceExisting = false,
): Promise<void> {
  const data = read();
  const workspace = data.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) throw new Error('Workspace not found.');

  const incomingDepths = tiers.map((tier) => normalizeStackDepth(tier.stackDepth));

  if (new Set(incomingDepths).size !== incomingDepths.length) {
    throw new Error('The import contains duplicate stack depths.');
  }

  const existingIds = new Set<string>();

  for (let index = 0; index < tiers.length; index++) {
    const tier = tiers[index];
    const depth = incomingDepths[index];
    const existing = workspace.stackTiers.find((item) => normalizeStackDepth(item.stackDepth) === depth);

    if (existing) {
      if (!replaceExisting) {
        throw new Error(`Stack depth ${depth}BB already exists and requires replacement confirmation.`);
      }

      existingIds.add(existing.id);
      const replacement = cloneTier(tier, existing.id);
      Object.assign(existing, replacement);
    } else {
      if (workspace.stackTiers.length >= 25) {
        throw new Error('A workspace can contain a maximum of 25 stack depths.');
      }

      workspace.stackTiers.push(cloneTier(tier));
    }
  }

  write(data);
}

export async function deleteStackTier(id: string): Promise<void> {
  const data = read();
  for (const workspace of data.workspaces) {
    workspace.stackTiers = workspace.stackTiers.filter((tier) => tier.id !== id);
  }
  write(data);
}

export async function replaceAllWorkspaces(items: Array<{ name: string } & Partial<ChartMetadata> & { stackTiers: StackTierInput[] }>): Promise<void> {
  const data = read();

  const workspaces = items.map((item) => {
    if (item.stackTiers.length > 25) {
      throw new Error('A workspace can contain a maximum of 25 stack depths.');
    }

    const depths = item.stackTiers.map((tier) => normalizeStackDepth(tier.stackDepth));

    if (new Set(depths).size !== depths.length) {
      throw new Error('A backup contains duplicate stack depths in one workspace.');
    }

    const workspace = makeWorkspace(item.name, item);
    workspace.stackTiers = item.stackTiers.map((tier) => cloneTier(tier));
    return workspace;
  });

  data.workspaces = workspaces.length ? workspaces : [makeWorkspace('Workspace 1')];
  data.activeId = data.workspaces[0].id;
  write(data);
}