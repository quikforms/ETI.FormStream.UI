import { Injectable } from '@angular/core';
import { FormValueInput, serializeForms } from '../state/models/render/form-value.serializer';
import { PrintFieldGroup, PrintRequest, formStreamPrintDefaults } from '../state/models/DTOs/print-request.model';

@Injectable()
export class PrintFormService {

  // Build the POST print/submit body from the current form values.
  // `inputs` are plain snapshots (no Angular Forms dependency here) → pure + testable.
  buildRequest(inputs: FormValueInput[], unid: string, customerId: string): PrintRequest {
    return {
      ...formStreamPrintDefaults(),
      unid,
      customerID: customerId,
      fields: serializeForms(inputs).map((form, index): PrintFieldGroup => ({
        formID: Number(form.formId),
        formInstance: form.formInstance,
        order: index,
        htmlFields: form.fields.map(field => ({ name: field.fieldName, value: encodeURIComponent(field.value) })),
      })),
    };
  }
}
