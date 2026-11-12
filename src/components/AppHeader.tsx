import { LayoutGrid } from 'lucide-react';
import { useRef } from 'react';

interface AppHeaderProps {
  onExportBackup: () => void;
  onImportBackupFile: (file: File) => void;
}

export default function AppHeader({ onExportBackup, onImportBackupFile }: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <span className="brand-mark">
          <LayoutGrid size={18} />
        </span>
        <h1>Preflop Gym Chart Manager</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="secondary" onClick={onExportBackup}>
          Export Backup
        </button>
        <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
          Import Backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onImportBackupFile(file);
          }}
        />
      </div>
    </header>
  );
}
