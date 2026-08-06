// Centralized render-convention tokens and small pure predicates.

export const NOTE_TEXT_PATTERN = /^note:/i;
export const MAX_VISUAL_DEPTH = 3;          // section depth visual clamp
export const INPUT_ROW_HEIGHT_PX = 36;      // base row height for multiline sizing
export const PLACEHOLDER_CHECKBOX_LABELS = ['', 'check here'];

export function isChoiceFieldType(fieldType: string): boolean {
  return fieldType === 'checkbox' || fieldType === 'radio';
}

export function isPlaceholderCheckboxLabel(label: string): boolean {
  return PLACEHOLDER_CHECKBOX_LABELS.includes((label || '').trim().toLowerCase());
}

export function maskPlaceholder(mask: string): string {
  return (mask || '').replace(/#/g, '_');
}
