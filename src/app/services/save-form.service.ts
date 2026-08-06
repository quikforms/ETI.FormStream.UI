import { Injectable } from '@angular/core';
import { FormValueInput, serializeForms } from '../state/models/render/form-value.serializer';
import { FieldGroup, SaveFormsRequest } from '../state/models/DTOs/save-forms-request.model';

@Injectable()
export class SaveFormService {

  // Build the POST formstream/save body from the current form values.
  // `inputs` are plain snapshots (no Angular Forms dependency here) → pure + testable.
  buildRequest(inputs: FormValueInput[], unid: string, packageName: string): SaveFormsRequest {
    return {
      Forms: serializeForms(inputs).map((form, index): FieldGroup => ({
        FormID: Number(form.formId),
        FormInstance: form.formInstance,
        Order: index,
        HTMLFields: form.fields.map(field => ({ Name: field.fieldName, Value: field.value })),
      })),
      UNID: unid,
      FormPackageName: packageName,
    };
  }
}
