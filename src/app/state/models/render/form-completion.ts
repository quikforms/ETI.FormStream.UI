// Per-form completion metrics. Pure (no Angular) so it can be unit-tested and reused.
export interface FormCompletion {
  filled: number;
  total: number;
  missing: number;
  percent: number;   // 0-100
}

// Count the filled controls of a form against its precomputed fillable total.
// The FormGroup only ever holds fillable controls (the structure builder already
// drops static text, signature and reset), so every value here is a fillable field.
export function computeCompletion(values: Record<string, string>, total: number): FormCompletion {
  const filled = Object.values(values).filter(value => value != null && value !== '').length;
  const missing = Math.max(0, total - filled);
  // Clamp to the documented 0-100 contract, guarding against a future caller passing
  // more filled values than `total`.
  const percent = total === 0 ? 100 : Math.min(100, Math.round((filled / total) * 100));
  return { filled, total, missing, percent };
}
