import type { HandActions, StackTierInput } from '@/types/chart';

export class ValidationError extends Error {}

const STACK_DEPTH_PATTERN = /^(?:\d{1,4}|\d{1,4}-\d{1,4}|\d{1,4}\+)$/;

export function normalizeStackDepth(value: string | number): string {
  return String(value).trim().replace(/\s*BB$/i, '');
}

export function validateStackDepth(value: unknown, filename: string): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || !STACK_DEPTH_PATTERN.test(normalizeStackDepth(value))) {
    throw new ValidationError(`${filename} needs a valid stackDepth, such as 20, 17-19 or 20+.`);
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
    hands: { ...tier.hands },
    ...(tier.sizings ? { sizings: { ...tier.sizings } } : {}),
    ...(tier.mixedStrategies ? { mixedStrategies: { ...tier.mixedStrategies } } : {}),
  };
}

export function validateStackTier(item: unknown, filename: string): StackTierInput {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    throw new ValidationError(`${filename} does not contain a stack depth object.`);
  }
  const record = item as Record<string, unknown>;
  const stackDepth = validateStackDepth(record.stackDepth, filename);
  if (typeof record.hands !== 'object' || record.hands === null || Array.isArray(record.hands)) {
    throw new ValidationError(`${filename} needs a hands object.`);
  }
  const hands: HandActions = {};
  for (const [hand, action] of Object.entries(record.hands as Record<string, unknown>)) {
    if (typeof action !== 'string' || !action.trim()) {
      throw new ValidationError(`${filename} contains an invalid action for ${hand}.`);
    }
    hands[hand] = action.trim();
  }

  let sizings: Record<string, string> | undefined;
  if (record.sizings !== undefined) {
    if (typeof record.sizings !== 'object' || record.sizings === null || Array.isArray(record.sizings)) {
      throw new ValidationError(`${filename} has an invalid sizings object.`);
    }
    sizings = {};
    for (const [key, value] of Object.entries(record.sizings as Record<string, unknown>)) {
      if (typeof value !== 'string' || !value.trim()) throw new ValidationError(`${filename} has an invalid sizing for ${key}.`);
      sizings[key] = value.trim();
    }
  }

  let mixedStrategies: Record<string, unknown> | undefined;
  if (record.mixedStrategies !== undefined) {
    if (typeof record.mixedStrategies !== 'object' || record.mixedStrategies === null || Array.isArray(record.mixedStrategies)) {
      throw new ValidationError(`${filename} has an invalid mixedStrategies object.`);
    }
    mixedStrategies = record.mixedStrategies as Record<string, unknown>;
  }

  return {
    stackDepth,
    filename: typeof record.filename === 'string' && record.filename ? record.filename : filename,
    hands,
    ...(sizings ? { sizings } : {}),
    ...(mixedStrategies ? { mixedStrategies } : {}),
  };
}

export function parseStackPayload(raw: string, filename: string): StackTierInput[] {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new ValidationError(`${filename} is not valid JSON.`); }
  const items = Array.isArray(parsed) ? parsed : [parsed];
  if (!items.length) throw new ValidationError(`${filename} contains no stack depths.`);
  return items.map((item) => validateStackTier(item, filename));
}
