import type { CombinedChart, GlobalChartTier, MttStage, Workspace } from '@/types/chart';
import { normalizeStackDepth } from '@/lib/stackFile';

export interface ValidationResult { errors: string[]; warnings: string[] }
type Tier = Workspace['stackTiers'][number];

function buildTier(tier: Tier): GlobalChartTier {
  const ranges: Record<string, string[]> = {
    fold: [...tier.ranges.fold],
    call: [...tier.ranges.call],
    all_in: [...tier.ranges.all_in],
    raise: [...tier.ranges.raise],
    raise_2: [...tier.ranges.raise_2],
    raise_3: [...tier.ranges.raise_3],
  };

  const output: GlobalChartTier = { ranges };

  if (tier.sizings && Object.keys(tier.sizings).length) {
    output.sizings = { ...tier.sizings };
  }

  if (tier.mixedStrategies && Object.keys(tier.mixedStrategies).length) {
    output.mixedStrategies = { ...tier.mixedStrategies };
  }

  return output;
}

function stackSortValue(value: string): number {
  const normalized = normalizeStackDepth(value);
  if (normalized.endsWith('+')) return Number(normalized.slice(0, -1)) + 100000;
  const range = normalized.match(/^(\d+)-(\d+)$/);
  if (range) return Number(range[2]);
  return Number(normalized);
}

export function validateWorkspace(workspace: Workspace): ValidationResult {
  const errors: string[] = [];
  if (!workspace.format) errors.push('Select a chart format.');
  if (!workspace.tableType) errors.push('Select a table type.');
  if (!workspace.heroPosition) errors.push('Select the hero position.');
  if (!workspace.situation) errors.push('Select a situation.');
  if (workspace.format === 'mtt' && !workspace.mttStage) errors.push('Select an MTT tournament stage.');
  if (workspace.stackTiers.length < 2) errors.push('Import at least 2 stack depths.');
  if (workspace.stackTiers.length > 25) errors.push('A maximum of 25 stack depths is allowed.');
  return { errors, warnings: [] };
}

export function buildCombinedChart(workspace: Workspace): CombinedChart {
  const stackSize: CombinedChart['stack_size'] = {};
  const sorted = [...workspace.stackTiers].sort((a, b) => stackSortValue(b.stackDepth) - stackSortValue(a.stackDepth));

  for (const tier of sorted) {
    const key = `${normalizeStackDepth(tier.stackDepth)}BB`;
    const globalTier = buildTier(tier);

    stackSize[key] = workspace.format === 'mtt'
      ? { [workspace.mttStage as MttStage]: globalTier }
      : globalTier;
  }

  return {
    schemaVersion: 1,
    format: workspace.format as CombinedChart['format'],
    tableType: workspace.tableType,
    hero: workspace.heroPosition.trim().toUpperCase(),
    situation: workspace.situation.trim(),
    opponent: workspace.opponent.trim().toUpperCase() || 'none',
    extraSeats: workspace.extraSeats.split(',').map((seat) => seat.trim().toUpperCase()).filter(Boolean),
    stack_size: stackSize,
  };
}