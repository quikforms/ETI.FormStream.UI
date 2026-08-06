// One DocuSign signing-group option offered in the signers table. `id`/`keyName` carry the DocuSign
// signing-group id (keyName is the value bound by the select); `name` is the display label. Mirrors the
// Quik! App esign model so the two stay contract-compatible.
export interface SigningGroupOption {
  id: string;
  name: string;
  keyName: string;
}
