export class AttachedFile {
  
    constructor(
      public id: number = 0,
      public name: string = '',
      public addedBeforeForms: boolean = false,
      public fileSize: number = 0
    ) { }

    static clone = (attachedFile: AttachedFile): AttachedFile => {
      return new AttachedFile(attachedFile.id, attachedFile.name, attachedFile.addedBeforeForms, attachedFile.fileSize);
    };

    static default = () =>
        new AttachedFile(0, '', false, 0);

    // Endpoint response shape (AttachmentOutV2, PascalCase) — upload/load responses.
    static fromRaw = (raw: any): AttachedFile => {
        return new AttachedFile(raw.Id || 0, raw.Name || '', raw.AddedBeforeForms || false, raw.FileSize || 0);
    }

    // V2 payload shape (FormStreamAttachment, camelCase) — initial list carried on intake.
    static fromPayload = (raw: PayloadAttachment): AttachedFile => {
        return new AttachedFile(raw.documentID || 0, raw.displayName || '', raw.addedBeforeForms || false, raw.fileSize || 0);
    }

}

// Attachment as serialized in the V2 transaction payload (transaction.attachments[]).
export interface PayloadAttachment {
    documentID: number;
    displayName: string;
    addedBeforeForms: boolean;
    fileSize: number;
}

export interface FileUploadData {
    file: File;
    addBeforeForm: boolean;
}

export interface SelectedFile {
    id: string;
    file: File;    
}