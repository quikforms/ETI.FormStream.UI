import { FormMetadata } from './form-metadata.model';

export class Form {
  constructor(
    public metadata: FormMetadata = new FormMetadata(),
    public elements: any[] = []   // raw recursive tree, discriminated by `type` at render time
  ) {}

  static fromRaw = (raw: any): Form =>
    new Form(FormMetadata.fromRaw(raw.metadata || {}), raw.elements || []);
}
