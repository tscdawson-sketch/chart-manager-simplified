import type { StackTier } from '@/types/chart';
import { downloadJson } from '@/lib/download';
import { normalizeStackDepth } from '@/lib/stackFile';

interface StackCollectionPanelProps {
  tiers: StackTier[];
  onRemoveTier: (tier: StackTier) => void;
}

function sortValue(value: string): number {
  if (value.endsWith('+')) return Number(value.slice(0, -1)) + 100000;
  const range = value.match(/^(\d+)-(\d+)$/);
  return range ? Number(range[2]) : Number(value);
}

function buildTierJson(tier: StackTier) {
  return {
    stackDepth: `${normalizeStackDepth(tier.stackDepth)}BB`,
    ranges: {
      fold: [...tier.ranges.fold],
      call: [...tier.ranges.call],
      all_in: [...tier.ranges.all_in],
      raise: [...tier.ranges.raise],
      raise_2: [...tier.ranges.raise_2],
      raise_3: [...tier.ranges.raise_3],
    },
    sizings: {
      R1: tier.sizings.R1 ?? '',
      R2: tier.sizings.R2 ?? '',
      R3: tier.sizings.R3 ?? '',
    },
    mixedStrategies: { ...tier.mixedStrategies },
  };
}

export default function StackCollectionPanel({ tiers, onRemoveTier }: StackCollectionPanelProps) {
  const sortedTiers = [...tiers].sort((a, b) => sortValue(b.stackDepth) - sortValue(a.stackDepth));

  const handleCopyJson = async (tier: StackTier) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildTierJson(tier), null, 2));
      window.alert(`${tier.stackDepth}BB JSON copied.`);
    } catch {
      window.alert('Could not copy the JSON. Please check clipboard permissions.');
    }
  };

  const handleExportJson = (tier: StackTier) => {
    downloadJson(`stack-${normalizeStackDepth(tier.stackDepth)}BB.json`, buildTierJson(tier));
  };

  return (
    <div className="panel">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="mb-0">3. Stack Depths ({tiers.length}/25)</h2>
        <span className="text-sm text-muted">Minimum 2 · Maximum 25</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Stack</th>
              <th>Filename</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTiers.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted">No stack depths imported yet.</td>
              </tr>
            )}
            {sortedTiers.map((tier) => (
              <tr key={tier.id}>
                <td className="font-semibold">{tier.stackDepth}BB</td>
                <td className="break-all text-muted">{tier.filename}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="small" onClick={() => void handleCopyJson(tier)}>
                      Copy JSON
                    </button>
                    <button type="button" className="small" onClick={() => handleExportJson(tier)}>
                      Export JSON
                    </button>
                    <button type="button" className="danger small" onClick={() => onRemoveTier(tier)}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}