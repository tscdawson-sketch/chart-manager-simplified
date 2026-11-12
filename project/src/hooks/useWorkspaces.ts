import { useCallback, useEffect, useRef, useState } from 'react';
import * as repository from '@/lib/workspaceRepository';
import type { BackupWorkspace, ChartMetadata, StackTierInput, Workspace } from '@/types/chart';

type LoadStatus = 'loading' | 'ready' | 'error';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const started = useRef(false);

  const reload = useCallback(async () => {
    const list = await repository.fetchWorkspaces();
    const savedActiveId = await repository.getActiveWorkspaceId();
    setWorkspaces(list);
    setActiveId(list.some((item) => item.id === savedActiveId) ? savedActiveId : list[0]?.id ?? null);
    return list;
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    reload().then(() => setStatus('ready')).catch(() => setStatus('error'));
  }, [reload]);

  const activeWorkspace = workspaces.find((item) => item.id === activeId) ?? null;
  const selectWorkspace = useCallback((id: string) => {
    setActiveId(id);
    void repository.setActiveWorkspace(id);
  }, []);
  const createWorkspace = useCallback(async () => {
    const id = await repository.createWorkspace(`Workspace ${workspaces.length + 1}`);
    await reload();
    setActiveId(id);
  }, [reload, workspaces.length]);
  const renameWorkspace = useCallback(async (id: string, name: string) => {
    await repository.renameWorkspace(id, name);
    setWorkspaces((previous) => previous.map((item) => item.id === id ? { ...item, name } : item));
  }, []);
  const updateMetadata = useCallback(async (id: string, patch: Partial<ChartMetadata>) => {
    await repository.updateWorkspaceMetadata(id, patch);
    setWorkspaces((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
  }, []);
  const importTiers = useCallback(async (id: string, tiers: StackTierInput[]) => {
    await repository.upsertStackTiers(id, tiers);
    await reload();
  }, [reload]);
  const deleteTier = useCallback(async (id: string) => {
    await repository.deleteStackTier(id);
    await reload();
  }, [reload]);
  const importBackup = useCallback(async (items: BackupWorkspace[]) => {
    await repository.replaceAllWorkspaces(items);
    await reload();
  }, [reload]);

  return { workspaces, activeWorkspace, status, selectWorkspace, createWorkspace, renameWorkspace, updateMetadata, importTiers, deleteTier, importBackup };
}
