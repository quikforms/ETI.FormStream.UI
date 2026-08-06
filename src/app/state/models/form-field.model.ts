import { FormFieldStatus } from './form-field-status.enum';

export class FormField {
  
  constructor(
    public formFieldsID: number = 0,
    public formId: number = 0,
    public formPageID: number = 0,
    public fullFieldName: string = '',
    public fieldTypeID: number = 0,
    public defaultValue: string = '',
    public exportValue: string = '',
    public dataTypeID: number = 0,
    public name: string = '', //qfDLevel2FieldSystemName
    public value: string = '',
    public sectionId: number = 0,
    public checkboxes: FormField [] = [],
    public fieldLabel: string = "",
    public uiStatus: FormFieldStatus = FormFieldStatus.Untouched,
    public isRequired: boolean = false) { }


    isEmpty = () => {
      return !this.value;
    }

    static clone = (formField: FormField): FormField => {
      return new FormField(formField.formFieldsID, formField.formId, formField.formPageID, formField.fullFieldName,
        formField.fieldTypeID, formField.defaultValue, formField.exportValue, formField.dataTypeID, formField.name,
        formField.value, formField.sectionId, formField.checkboxes, formField.fieldLabel,
        formField.uiStatus, formField.isRequired);
    };

    static default = () =>
        new FormField(0, 0, 0, 'Test Field 1', 0, '', '', 0, '', 'Test Field 1', 0);

    static fromRaw = (raw: any): FormField => {
      return new FormField(raw.FormFieldsID, raw.QFFormID, raw.FormPageID, raw.FullFieldName,
        raw.FieldTypeID, raw.DefaultValue, raw.ExportValue || '', raw.DataTypeID, raw.QFDLevel2FieldSystemName || '',
        raw.Value || '', 0, raw.checkboxes || [], raw.FieldLabel || '', FormFieldStatus.Untouched, false);
    };

}
