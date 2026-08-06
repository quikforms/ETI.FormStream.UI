// The request body posted to docusign/signing-groups. Built from the SignSettings baseline; the DocuSign
// endpoint identifies the account/environment from these fields and returns the available signing groups.
export interface SigningGroupsRequest {
  SignEnvironmentID: string | number;
  AccountID: string;
  SenderUserID: string;
  AuthUserID: string;
}
