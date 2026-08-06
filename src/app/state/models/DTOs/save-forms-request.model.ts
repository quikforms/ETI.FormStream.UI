// Outbound DTO for POST formstream/save (PascalCase = backend SaveFormsRequest).
// Build-only — never parsed from a response. (FormPackageID in the response is
// unused: package identity is resolved via UNID.)
export interface HtmlField { Name: string; Value: string; }

export interface FieldGroup {
  FormID: number;
  FormInstance: number;
  Order: number;
  HTMLFields: HtmlField[];
}

export interface SaveFormsRequest {
  Forms: FieldGroup[];
  UNID: string;
  FormPackageName: string;
}
