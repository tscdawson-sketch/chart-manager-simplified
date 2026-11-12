import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ChartMetadataPanel from '@/components/ChartMetadataPanel';
import CombinedOutputPanel from '@/components/CombinedOutputPanel';
import Notice, { type NoticeState } from '@/components/Notice';
import StackCollectionPanel from '@/components/StackCollectionPanel';
import StackImportPanel, { type PickedFile } from '@/components/StackImportPanel';
import WorkspaceBar from '@/components/WorkspaceBar';
import WorkspaceNamePanel from '@/components/WorkspaceNamePanel';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { parseBackup, buildBackup } from '@/lib/backup';
import { downloadJson } from '@/lib/download';
import { ValidationError, parseStackPayload, normalizeStackDepth } from '@/lib/stackFile';
import type { ChartMetadata, StackTier, StackTierInput } from '@/types/chart';

const NOTICE_DURATION_MS = 4000;

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export default function App() {
  const store = useWorkspaces();
  const { workspaces, activeWorkspace, status } = store;
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const runAction = async (task: () => Promise<string | void>, failureMessage: string): Promise<boolean> => {
    try {
      const successMessage = await task();
      setNotice(successMessage ? { tone: 'success', message: successMessage } : null);
      return true;
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : failureMessage,
      });
      return false;
    }
  };

  const handleExportBackup = () => {
    downloadJson('preflop-gym-chart-backup.json', buildBackup(workspaces));
  };

  const handleImportBackupFile = (file: File) =>
    runAction(async () => {
      const imported = parseBackup(await file.text());
      if (imported.length === 0) throw new ValidationError('That backup does not contain any workspaces.');
      await store.importBackup(imported);
      return `Imported ${pluralize(imported.length, 'workspace')} from the backup.`;
    }, 'Could not import that backup. Please try again.');

  const handleCreateWorkspace = () =>
    runAction(async () => {
      await store.createWorkspace();
    }, 'Could not create a new workspace. Please try again.');

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <p className="centered-state">Loading your charts...</p>
      </div>
    );
  }

  if (status === 'error' || !activeWorkspace) {
    return (
      <div className="app-shell">
        <div className="panel centered-state">
          We could not load your saved charts. Refresh the page to try again.
        </div>
      </div>
    );
  }

  const workspace = activeWorkspace;

  const handleRenameWorkspace = (name: string) =>
    runAction(() => store.renameWorkspace(workspace.id, name), 'Could not rename the workspace. Please try again.');

  const handleUpdateMetadata = (patch: Partial<ChartMetadata>) =>
    runAction(() => store.updateMetadata(workspace.id, patch), 'Could not save that change. Please try again.');

  const importTiersWithConfirmation = async (tiers: StackTierInput[]): Promise<boolean> => {
    const existingDepths = new Set(
      workspace.stackTiers.map((tier) => normalizeStackDepth(tier.stackDepth)),
    );

    const replacementDepths = [...new Set(
      tiers
        .map((tier) => normalizeStackDepth(tier.stackDepth))
        .filter((depth) => existingDepths.has(depth)),
    )];

    for (const depth of replacementDepths) {
      const confirmed = window.confirm(
        `A stack depth of ${depth}BB already exists. Would you like to replace it with the imported version?`,
      );

      if (!confirmed) return false;
    }

    await store.importTiers(workspace.id, tiers, replacementDepths.length > 0);
    return true;
  };

  const handleImportPaste = (text: string) =>
    runAction(async () => {
      const tiers = parseStackPayload(text, 'Pasted JSON');
      const imported = await importTiersWithConfirmation(tiers);

      if (!imported) return;

      return `Imported ${pluralize(tiers.length, 'stack tier')}.`;
    }, 'Could not import the pasted JSON. Please try again.');

  const handleImportFiles = (files: PickedFile[]) =>
    runAction(async () => {
      const tiers = files.flatMap((file) => parseStackPayload(file.text, file.name));
      const imported = await importTiersWithConfirmation(tiers);

      if (!imported) return;

      return `Imported ${pluralize(tiers.length, 'stack tier')}.`;
    }, 'Could not import those files. Please try again.');

  const handleRemoveTier = (tier: StackTier) => {
    if (!window.confirm(`Remove the ${tier.stackDepth}BB stack depth from this workspace?`)) return;
    void runAction(() => store.deleteTier(tier.id), 'Could not remove that tier. Please try again.');
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        <AppHeader
          onExportBackup={handleExportBackup}
          onImportBackupFile={(file) => void handleImportBackupFile(file)}
        />

        {notice && <Notice notice={notice} onDismiss={() => setNotice(null)} />}

        <WorkspaceBar
          workspaces={workspaces}
          activeId={workspace.id}
          onSelect={store.selectWorkspace}
          onCreate={() => void handleCreateWorkspace()}
        />

        <WorkspaceNamePanel
          key={workspace.id}
          workspace={workspace}
          onRename={(name) => void handleRenameWorkspace(name)}
        />

        <div className="grid-container">
          <div className="flex flex-col gap-4">
            <ChartMetadataPanel
              key={workspace.id}
              workspace={workspace}
              onUpdate={(patch) => void handleUpdateMetadata(patch)}
            />
            <StackImportPanel
              onImportPaste={handleImportPaste}
              onImportFiles={(files) => void handleImportFiles(files)}
            />
          </div>

          <div className="flex flex-col gap-4">
            <StackCollectionPanel
              tiers={workspace.stackTiers}
              onRemoveTier={handleRemoveTier}
            />
            <CombinedOutputPanel key={workspace.id} workspace={workspace} />
          </div>
        </div>
      </div>
    </div>
  );
}