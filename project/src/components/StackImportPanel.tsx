import { useRef, useState } from 'react';

export interface PickedFile {
  name: string;
  text: string;
}

interface StackImportPanelProps {
  onImportPaste: (text: string) => Promise<boolean>;
  onImportFiles: (files: PickedFile[]) => void;
}

export default function StackImportPanel({ onImportPaste, onImportFiles }: StackImportPanelProps) {
  const [pasteText, setPasteText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    setImporting(true);
    const succeeded = await onImportPaste(pasteText);
    setImporting(false);
    if (succeeded) setPasteText('');
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = await Promise.all(
      Array.from(files).map(async (file) => ({ name: file.name, text: await file.text() })),
    );
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImportFiles(picked);
  };

  return (
    <div className="panel">
      <h2>2. Import Stack Tiers</h2>
      <label htmlFor="paste-json-area">Paste Stack JSON</label>
      <textarea
        id="paste-json-area"
        placeholder="Paste exported stack depth JSON here..."
        value={pasteText}
        onChange={(event) => setPasteText(event.target.value)}
        className="json-area h-40"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handlePaste} disabled={!pasteText.trim() || importing}>
          Import JSON
        </button>
        <button type="button" className="secondary" onClick={() => setPasteText('')} disabled={!pasteText}>
          Clear
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor="file-input">Or Select Files</label>
        <input
          id="file-input"
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>
    </div>
  );
}
