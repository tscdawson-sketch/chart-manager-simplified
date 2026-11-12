import { useEffect, useState } from 'react';
import { buildCombinedChart, validateWorkspace } from '@/lib/chartValidation';
import { downloadJson, toSafeFilename } from '@/lib/download';
import type { CombinedChart, Workspace } from '@/types/chart';

interface CombinedOutputPanelProps {
  workspace: Workspace;
}

export default function CombinedOutputPanel({ workspace }: CombinedOutputPanelProps) {
  const [chart, setChart] = useState<CombinedChart | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const canBuild = validateWorkspace(workspace).errors.length === 0;
  const outputText = chart ? JSON.stringify(chart, null, 2) : '';

  useEffect(() => {
    setChart(null);
    setCopyState('idle');
  }, [workspace]);

  const handleBuild = () => {
    setChart(buildCombinedChart(workspace));
    setCopyState('idle');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const handleDownload = () => {
    if (!chart) return;
    downloadJson(`${toSafeFilename(workspace.name)}-combined-chart.json`, chart);
  };

  return (
    <div className="panel">
      <h2>5. Combined Output</h2>
      <button type="button" className="build-button" onClick={handleBuild} disabled={!canBuild}>
        BUILD COMBINED CHART
      </button>
      <textarea
        readOnly
        value={outputText}
        placeholder="Combined canonical chart JSON preview..."
        aria-label="Combined chart JSON"
        className="json-area h-56"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="secondary" onClick={handleCopy} disabled={!chart}>
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy JSON'}
        </button>
        <button type="button" className="secondary" onClick={handleDownload} disabled={!chart}>
          Download JSON
        </button>
        <button type="button" className="secondary" onClick={() => setChart(null)} disabled={!chart}>
          Clear Output
        </button>
      </div>
    </div>
  );
}