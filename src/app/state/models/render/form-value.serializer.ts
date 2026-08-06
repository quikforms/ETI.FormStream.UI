import { FieldDescriptor } from './render-model';

// Neutral, casing-agnostic serialization of the current form values.
// Consumed by Save and Print; each maps the result to its
// own request shape/casing. Pure (no Angular) -> directly unit-testable.

export interface SerializedField { fieldName: string; value: string; }
export interface SerializedForm { formId: string; formInstance: number; fields: SerializedField[]; }

export interface FormValueInput {
  formId: string;
  formInstance: number;
  descriptors: FieldDescriptor[];
  values: Record<string, string>;   // controlKey → current value (FormGroup snapshot)
}

// Map each form's controls to { fieldName, value }, keeping only filled fields.
// Signature/reset fields are absent by construction (filtered during the build),
// so no extra exclusion is needed here.
export function serializeForms(inputs: FormValueInput[]): SerializedForm[] {
  return inputs.map(input => ({
    formId: input.formId,
    formInstance: input.formInstance,
    fields: input.descriptors
      .map(d => ({ fieldName: d.fieldName, value: input.values[d.controlKey] }))
      .filter(f => f.value != null && f.value !== ''),
  }));
}
