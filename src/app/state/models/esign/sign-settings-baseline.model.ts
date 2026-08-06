// The subset of the e-sign SignSettings baseline that FormStream reads. The full baseline
// (esignData.signSettings) is vendor-shaped and kept opaque; only these fields are consumed here — to
// build the signing-groups request — so they are typed explicitly instead of reaching into `any`.
export interface SignSettingsBaseline {
  AuthUserID?: string;
  SignEnvironmentID?: string | number;
  SenderUserID?: string;
  AccountID?: string;
}
