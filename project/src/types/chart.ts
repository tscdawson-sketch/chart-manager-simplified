export type MttStage = 'chipev' | 'bubble' | 'itm' | 'final-table';

export interface ChartMetadata {
  format: string;
  tableType: string;
  heroPosition: string;
  situation: string;
  opponent: string;
  extraSeats: string;
  mttStage: MttStage | '';
}

export type HandActions = Record<string, string>;

export interface StackTierInput {
  stackDepth: string | number;
  filename: string;
  hands: HandActions;
  sizings?: Record<string, string>;
  mixedStrategies?: Record<string, unknown>;
}

export interface StackTier extends Omit<StackTierInput, 'stackDepth'> {
  id: string;
  stackDepth: string;
}

export interface Workspace extends ChartMetadata {
  id: string;
  name: string;
  stackTiers: StackTier[];
}

export interface GlobalChartTier {
  ranges: Record<string, string[]>;
  sizings?: Record<string, string>;
  mixedStrategies?: Record<string, unknown>;
  position?: string;
}

export interface CombinedChart {
  schemaVersion: 1;
  format: 'spin-and-go' | 'cash-games' | 'heads-up-endgame' | 'mtt';
  tableType: string;
  hero: string;
  situation: string;
  opponent: string;
  extraSeats: string[];
  stack_size: Record<string, GlobalChartTier | Partial<Record<MttStage, GlobalChartTier>>>;
}

export interface BackupWorkspace extends ChartMetadata {
  name: string;
  stackTiers: StackTierInput[];
}
