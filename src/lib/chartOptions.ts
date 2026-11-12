export interface Option {
  value: string;
  label: string;
}

export const FORMAT_OPTIONS: Option[] = [
  { value: 'spin-and-go', label: 'Spin & Go' },
  { value: 'cash-games', label: 'Cash Games' },
  { value: 'heads-up-endgame', label: 'Heads-Up Endgame' },
  { value: 'mtt', label: 'MTT' },
];

export const MTT_STAGE_OPTIONS: Option[] = [
  { value: 'chipev', label: 'Chip EV' },
  { value: 'bubble', label: 'Bubble' },
  { value: 'itm', label: 'ITM' },
  { value: 'final-table', label: 'Final Table' },
];

const TABLE_TYPES_BY_FORMAT: Record<string, string[]> = {
  'spin-and-go': ['3-Max'],
  'cash-games': ['6-Max', '9-Max'],
  'heads-up-endgame': ['Heads-Up'],
  mtt: ['6-Max', '9-Max'],
};

const HERO_POSITIONS_BY_TABLE: Record<string, string[]> = {
  '3-Max': ['BTN', 'SB', 'BB'],
  '6-Max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '9-Max': ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  'Heads-Up': ['SB', 'BB'],
};

export const SITUATION_OPTIONS: string[] = [
  'RFI',
  'vs Limp',
  'vs Open Raise',
  'vs 3-Bet',
  'vs 4-Bet',
  'Push / Fold',
];

export function getFormatLabel(value: string): string {
  return FORMAT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getTableTypes(format: string): string[] {
  return TABLE_TYPES_BY_FORMAT[format] ?? [];
}

export function getHeroPositions(tableType: string): string[] {
  return HERO_POSITIONS_BY_TABLE[tableType] ?? [];
}