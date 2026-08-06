// A selectable option for the e-sign dropdowns (send type, identity check). Generic over the key
// type so it serves both the string-keyed send types and the numeric-keyed identity checks.
export interface EsignOption<TKey> {
  keyName: TKey;
  name: string;
  selected?: boolean;
}
