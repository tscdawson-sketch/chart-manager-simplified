import type { StackTier } from '@/types/chart';

interface StackCollectionPanelProps {
  tiers: StackTier[];
  onRemoveTier: (tier: StackTier) => void;
}

function sortValue(value: string): number {
  if (value.endsWith('+')) return Number(value.slice(0, -1)) + 100000;
  const range = value.match(/^(\d+)-(\d+)$/);
  return range ? Number(range[2]) : Number(value);
}

export default function StackCollectionPanel({ tiers, onRemoveTier }: StackCollectionPanelProps) {
  const sortedTiers = [...tiers].sort((a, b) => sortValue(b.stackDepth) - sortValue(a.stackDepth));
  return (
    <div className="panel">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="mb-0">3. Stack Depths ({tiers.length}/25)</h2>
        <span className="text-sm text-muted">Minimum 2 · Maximum 25</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Stack</th><th>Filename</th><th className="text-right">Action</th></tr></thead>
          <tbody>
            {sortedTiers.length === 0 && <tr><td colSpan={3} className="text-muted">No stack depths imported yet.</td></tr>}
            {sortedTiers.map((tier) => (
              <tr key={tier.id}>
                <td className="font-semibold">{tier.stackDepth}BB</td>
                <td className="break-all text-muted">{tier.filename}</td>
                <td><div className="flex justify-end"><button type="button" className="danger small" onClick={() => onRemoveTier(tier)}>Remove</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
