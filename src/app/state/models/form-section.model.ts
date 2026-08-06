import { FormField } from "./form-field.model";


export class FormSection {

    constructor(
        public id: number,
        public name: string,
        public title: string,
        public description: string,
        public formFields: FormField[]) { }

    static clone = (formSection: FormSection): FormSection => {
      return new FormSection(formSection.id, formSection.name, formSection.title, formSection.description, formSection.formFields.map(x => FormField.clone(x)))
    };

    static default = () =>
        new FormSection(0, 'Test Section Name', 'Test Section Title', 'Test Section Description', [new FormField(1, 0, 0, '', 0, '', '', 0, '', '', 0), new FormField(2, 0, 0, '', 0, '', '', 0, '', '', 0)]);

    static fromRaw = (raw: any): FormSection => {

        let formFields: FormField[] = [];
        
        raw.formFields.map((field: any) => {
            formFields.push(FormField.fromRaw(field));
        });

        return new FormSection(raw.id, raw.name, raw.title, raw.description, formFields);
    };
    
}