import { Plus } from 'lucide-react';
import type { Workspace } from '@/types/chart';

interface WorkspaceBarProps {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export default function WorkspaceBar({ workspaces, activeId, onSelect, onCreate }: WorkspaceBarProps) {
  return (
    <div className="workspace-bar">
      <span className="text-sm font-medium text-muted">Workspaces:</span>
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          type="button"
          className={`ws-tab ${workspace.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(workspace.id)}
        >
          {workspace.name}
        </button>
      ))}
      <button type="button" className="new-workspace" onClick={onCreate}>
        <Plus size={14} />
        New Workspace
      </button>
    </div>
  );
}
