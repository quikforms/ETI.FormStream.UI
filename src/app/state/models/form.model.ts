import { FormField } from "./form-field.model";
import { FormSection } from "./form-section.model";

export class Form {
  
  constructor(
    public id: number = 0,
    public fileInfoID: number = 0,
    public order: number = 0,
    public name: string = '',
    public description: string = '',
    public formCompany: string = '',
    public buildVersion: number = 0,
    public totalPages: number = 0,
    public createDate: string = '',
    public modifyDate: string = '',
    public formPageID: number = 0,
    public formIDInstanceGroup: number = 0,
    public formSections: FormSection[] = []) { }

    static clone = (form: Form): Form => {
      return new Form(form.id, form.fileInfoID, form.order, form.name, form.description,
        form.formCompany, form.buildVersion, form.totalPages, form.createDate, form.modifyDate,
        form.formPageID, form.formIDInstanceGroup, form.formSections.map(x => FormSection.clone(x)));
    };

    static default = () =>
        new Form(0, 0, 0, '', '', '', 0, 0, '', '', 0, 0, [FormSection.default()]);

    static fromRaw = (raw: any): Form => {
      return new Form(raw.QFFormID || 0, raw.FormFileInfoID || 0, raw.FormOrder || 0,
        raw.FormName || '', raw.FormDesc || '', raw.FormCompany || '',
        raw.BuildVersion || 0, raw.TotalPages || 0, raw.CreateDate || '',
        raw.ModifyDate || '', raw.FormPageID || 0, raw.FormIDInstanceGroup || 0);
    };

    getAllFields(): FormField[] {     
      return this.formSections.flatMap(x => x.formFields)      
    }

    getAllFieldsWithValue(): FormField[] {
    return this.getAllFields().filter(field => 
        field.value !== null && 
        field.value !== undefined && 
        field.value !== ''
    );
}


}