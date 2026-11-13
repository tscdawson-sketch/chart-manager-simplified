import type { StackRanges, StackTierInput } from '@/types/chart';

export class ValidationError extends Error {}

const STACK_DEPTH_PATTERN = /^(?:\d{1,4}|\d{1,4}-\d{1,4}|\d{1,4}\+)$/;

const RANGE_KEYS = ['fold', 'call', 'all_in', 'raise', 'raise_2', 'raise_3'] as const;
const SIZING_KEYS = ['R1', 'R2', 'R3'] as const;

export function normalizeStackDepth(value: string | number): string {
  return String(value).trim().replace(/\s+/g, '').replace(/BB$/i, '');
}

export function validateStackDepth(value: unknown, filename: string): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || !STACK_DEPTH_PATTERN.test(normalizeStackDepth(value))) {
    throw new ValidationError(`${filename} needs a valid stackDepth, such as 20BB, 17-19BB or 20+BB.`);
  }
  const normalized = normalizeStackDepth(value);
  const range = normalized.match(/^(\d+)-(\d+)$/);
  if (range && Number(range[1]) >= Number(range[2])) {
    throw new ValidationError(`${filename} has an invalid stack range. The first number must be smaller.`);
  }
  if (Number(normalized.replace('+', '')) < 1) {
    throw new ValidationError(`${filename} stackDepth must be greater than zero.`);
  }
  return normalized;
}

export function toStackTierFile(tier: StackTierInput): StackTierInput {
  return {
    ...tier,
    stackDepth: normalizeStackDepth(tier.stackDepth),
    ranges: Object.fromEntries(
      RANGE_KEYS.map((key) => [key, [...tier.ranges[key]]]),
    ) as StackRanges,
    sizings: { ...tier.sizings },
    mixedStrategies: { ...tier.mixedStrategies },
  };
}

export function validateStackTier(item: unknown, filename: string): StackTierInput {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    throw new ValidationError(`${filename} does not contain a stack depth object.`);
  }

  const record = item as Record<string, unknown>;
  const stackDepth = validateStackDepth(record.stackDepth, filename);

  if (typeof record.ranges !== 'object' || record.ranges === null || Array.isArray(record.ranges)) {
    throw new ValidationError(`${filename} needs a ranges object.`);
  }

  const sourceRanges = record.ranges as Record<string, unknown>;
  const ranges = {} as StackRanges;

  for (const key of RANGE_KEYS) {
    const hands = sourceRanges[key];

    if (!Array.isArray(hands) || !hands.every((hand) => typeof hand === 'string' && hand.trim())) {
      throw new ValidationError(`${filename} needs a valid ${key} array in ranges.`);
    }

    ranges[key] = hands.map((hand: string) => hand.trim());
  }

  if (typeof record.sizings !== 'object' || record.sizings === null || Array.isArray(record.sizings)) {
    throw new ValidationError(`${filename} needs a sizings object.`);
  }

  const sourceSizings = record.sizings as Record<string, unknown>;
  const sizings: Record<string, string> = {};

  for (const key of SIZING_KEYS) {
    const value = sourceSizings[key];

    if (typeof value !== 'string') {
      throw new ValidationError(`${filename} needs a valid sizing value for ${key}.`);
    }

    sizings[key] = value.trim();
  }

  if (typeof record.mixedStrategies !== 'object' || record.mixedStrategies === null || Array.isArray(record.mixedStrategies)) {
    throw new ValidationError(`${filename} needs a mixedStrategies object.`);
  }

  return {
    stackDepth,
    filename: typeof record.filename === 'string' && record.filename ? record.filename : filename,
    ranges,
    sizings,
    mixedStrategies: record.mixedStrategies as Record<string, unknown>,
  };
}

export function parseStackPayload(raw: string, filename: string): StackTierInput[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError(`${filename} is not valid JSON.`);
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];

  if (!items.length) throw new ValidationError(`${filename} contains no stack depths.`);

  return items.map((item) => validateStackTier(item, filename));
}