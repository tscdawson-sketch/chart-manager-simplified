import type { BackupWorkspace, Workspace } from '@/types/chart';
import { ValidationError, validateStackTier } from '@/lib/stackFile';

const BACKUP_APP_ID = 'preflop-gym-chart-manager';
const BACKUP_VERSION = 1;

const VALID_MTT_STAGES = ['chipev', 'bubble', 'itm', 'final-table'];

export function buildBackup(workspaces: Workspace[]) {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    workspaces: workspaces.map((workspace) => ({
      name: workspace.name,
      format: workspace.format,
      tableType: workspace.tableType,
      heroPosition: workspace.heroPosition,
      situation: workspace.situation,
      opponent: workspace.opponent,
      extraSeats: workspace.extraSeats,
      mttStage: workspace.mttStage,
      stackTiers: workspace.stackTiers.map((tier) => ({
        stackDepth: `${tier.stackDepth}BB`,
        filename: tier.filename,
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
      })),
    })),
  };
}

function readString(record: Record<string, unknown>, key: string, fallback = ''): string {
  const value = record[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') {
    throw new ValidationError(`Backup field "${key}" must be text.`);
  }
  return value;
}

export function parseBackup(raw: string): BackupWorkspace[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError('That file is not a valid backup.');
  }

  if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as { workspaces?: unknown }).workspaces)) {
    throw new ValidationError('That file is not a valid backup.');
  }

  const { app, workspaces } = parsed as { app?: unknown; workspaces: unknown[] };

  if (app !== undefined && app !== BACKUP_APP_ID) {
    throw new ValidationError('That backup was not created by this app.');
  }

  return workspaces.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new ValidationError(`Workspace ${index + 1} in the backup is invalid.`);
    }

    const record = item as Record<string, unknown>;
    const tiers = Array.isArray(record.stackTiers) ? record.stackTiers : [];
    const mttStage = readString(record, 'mttStage');

    if (mttStage && !VALID_MTT_STAGES.includes(mttStage)) {
      throw new ValidationError(`Workspace ${index + 1} has an invalid MTT stage.`);
    }

    return {
      name: readString(record, 'name', `Imported workspace ${index + 1}`),
      format: readString(record, 'format'),
      tableType: readString(record, 'tableType'),
      heroPosition: readString(record, 'heroPosition'),
      situation: readString(record, 'situation'),
      opponent: readString(record, 'opponent', 'none'),
      extraSeats: readString(record, 'extraSeats'),
      mttStage: mttStage as BackupWorkspace['mttStage'],
      stackTiers: tiers.map((tier) => validateStackTier(tier, 'Backup stack')),
    };
  });
}