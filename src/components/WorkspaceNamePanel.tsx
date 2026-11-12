import { useState } from 'react';
import type { Workspace } from '@/types/chart';

interface WorkspaceNamePanelProps {
  workspace: Workspace;
  onRename: (name: string) => void;
}

export default function WorkspaceNamePanel({ workspace, onRename }: WorkspaceNamePanelProps) {
  const [draft, setDraft] = useState(workspace.name);
  const trimmed = draft.trim();
  const canRename = trimmed.length > 0 && trimmed !== workspace.name;

  return (
    <div className="panel">
      <form
        className="flex flex-wrap items-center gap-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          if (canRename) onRename(trimmed);
        }}
      >
        <input
          type="text"
          aria-label="Workspace name"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full max-w-xs"
        />
        <button type="submit" className="secondary" disabled={!canRename}>
          Rename
        </button>
      </form>
    </div>
  );
}
