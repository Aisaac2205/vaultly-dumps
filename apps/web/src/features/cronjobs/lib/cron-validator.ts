const FIELD_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // day of month
  [1, 12], // month
  [0, 7], // day of week (0 and 7 both mean Sunday)
];

const FIELD_NAMES = ["minute", "hour", "day-of-month", "month", "day-of-week"] as const;

function validateAtom(
  atom: string,
  min: number,
  max: number,
): boolean {
  // step: */N or X-Y/N or X/N
  const slashSplit = atom.split("/");
  if (slashSplit.length > 2) return false;
  const base = slashSplit[0];
  const step = slashSplit[1];

  if (step !== undefined) {
    if (!/^\d+$/.test(step)) return false;
    const stepNum = parseInt(step, 10);
    if (stepNum < 1) return false;
  }

  if (base === "*") return true;

  const rangeSplit = base.split("-");
  if (rangeSplit.length === 1) {
    if (!/^\d+$/.test(base)) return false;
    const v = parseInt(base, 10);
    return v >= min && v <= max;
  }
  if (rangeSplit.length === 2) {
    const [a, b] = rangeSplit;
    if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return false;
    const va = parseInt(a, 10);
    const vb = parseInt(b, 10);
    return va >= min && vb <= max && va <= vb;
  }
  return false;
}

function validateField(field: string, min: number, max: number): boolean {
  if (!field) return false;
  const atoms = field.split(",");
  return atoms.every((atom) => validateAtom(atom, min, max));
}

export interface CronValidationResult {
  valid: boolean;
  errorKey?: string;
  errorParams?: Record<string, string | number>;
}

export function validateCronExpression(
  expression: string,
): CronValidationResult {
  const trimmed = expression.trim();
  if (!trimmed) return { valid: false, errorKey: "cron.errorRequired" };

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return {
      valid: false,
      errorKey: "cron.errorFieldCount",
      errorParams: { count: parts.length },
    };
  }

  for (let i = 0; i < 5; i++) {
    const [min, max] = FIELD_RANGES[i];
    if (!validateField(parts[i], min, max)) {
      return {
        valid: false,
        errorKey: "cron.errorField",
        errorParams: { name: FIELD_NAMES[i], value: parts[i], min, max },
      };
    }
  }

  return { valid: true };
}

export function isValidCronExpression(expression: string): boolean {
  return validateCronExpression(expression).valid;
}
