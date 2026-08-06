// A minimal reference to a launched form (id + display name), passed into the send modal so it can
// list form names in the default message and compute the per-signer "Forms Included" cell without
// depending on the render view-models.
export interface EsignFormRef {
  formId: string;
  formName: string;
}
