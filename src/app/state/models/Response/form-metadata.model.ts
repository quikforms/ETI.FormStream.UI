export class FormMetadata {
  constructor(
    public formId: string = '',
    public formName: string = '',
    public formDescription: string = '',
    public formCompany: string = '',
    public literatureNumber: string = '',
    public generatedAt: string = '',
    public formInstance: number = 0
  ) {}

  static fromRaw = (raw: any): FormMetadata =>
    new FormMetadata(
      raw.formId || '', raw.formName || '', raw.formDescription || '',
      raw.formCompany || '', raw.literatureNumber || '', raw.generatedAt || '',
      raw.formInstance || 0
    );
}
