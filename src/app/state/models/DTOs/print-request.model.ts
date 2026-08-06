// Outbound DTO for POST print/submit (camelCase = downstream Forms API contract).
// Build-only — never parsed from a response.

export interface PrintHtmlField {
  name: string;
  value: string;   // URL-encoded by the caller (PrintFormService)
}

export interface PrintFieldGroup {
  formID: number;
  formInstance: number;
  order: number;
  htmlFields: PrintHtmlField[];
}

export interface PrintCustomFields {
  metaData: unknown[];
  fields: unknown[];
}

export interface PrintHiddenField {
  value: string;
  name: string;
}

export interface PrintRequest {
  editablePDF: boolean;
  includeCoverPage: boolean;
  unid: string;
  customerID: string;
  fields: PrintFieldGroup[];
  nativeESign: boolean;
  nativeESignatures: unknown[];
  signAllDocsCombined: boolean;
  signMultipleDocs: boolean;
  customFields: PrintCustomFields;
  forSign: boolean;
  qfeVersion: string;
  hiddenFields: PrintHiddenField[];
}

// FormStream never uses the sign / cover-page / custom-field features of the
// generic print contract — these are the fixed values it always sends. Single
// source of that decision; the service supplies only unid/customerID/fields.
// A factory (not a const) returns fresh arrays/objects so no mutable state is
// shared across requests.
export function formStreamPrintDefaults(): Omit<PrintRequest, 'unid' | 'customerID' | 'fields'> {
  return {
    editablePDF: false,
    includeCoverPage: false,
    nativeESign: false,
    nativeESignatures: [],
    signAllDocsCombined: false,
    signMultipleDocs: false,
    customFields: { metaData: [], fields: [] },
    forSign: false,
    qfeVersion: '',
    hiddenFields: [],
  };
}
