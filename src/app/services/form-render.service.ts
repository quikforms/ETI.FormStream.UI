import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FormStreamData } from '../state/models/Response/formstream-data.model';
import { Form } from '../state/models/Response/form.model';
import { CustomerData } from '../state/models/Response/customer-data.model';
import { FormStructure } from '../state/models/render/render-model';
import { FormStructureBuilder } from '../state/models/render/form-structure.builder';
import { FormValueInput } from '../state/models/render/form-value.serializer';

// Angular view-model: the pure structural model + a live Reactive Forms group.
export interface RenderedForm extends FormStructure {
  formGroup: FormGroup;
}

@Injectable()
export class FormRenderService {
  private readonly builder = new FormStructureBuilder();

  // Build a render-ready model (structure + FormGroup) for every form in the payload.
  buildRenderedForms(data: FormStreamData): RenderedForm[] {
    return (data?.forms || []).map(form => this.buildRenderedForm(form, data.customerData || []));
  }

  buildRenderedForm(form: Form, customerData: CustomerData[]): RenderedForm {
    const structure = this.builder.build(form, customerData);
    return { ...structure, formGroup: this.toFormGroup(structure.initialValues) };
  }

  // Snapshot every rendered form's current control values into plain, framework-
  // agnostic inputs for the Save/Print serializers (single source of the snapshot).
  toValueInputs(forms: RenderedForm[]): FormValueInput[] {
    return forms.map(form => ({
      formId: form.formId,
      formInstance: form.formInstance,
      descriptors: form.fieldDescriptors,
      values: form.formGroup.value as Record<string, string>,
    }));
  }

  // The only Angular-specific step: one control per baseline key.
  private toFormGroup(initialValues: Record<string, string>): FormGroup {
    const controls: Record<string, FormControl> = {};
    Object.keys(initialValues).forEach(key => { controls[key] = new FormControl(initialValues[key]); });
    return new FormGroup(controls);
  }
}
