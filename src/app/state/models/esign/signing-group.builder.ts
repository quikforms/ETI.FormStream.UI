import { SignSettingsBaseline } from './sign-settings-baseline.model';
import { SigningGroupsRequest } from './signing-groups-request.model';
import { SigningGroupOption } from './signing-group-option.model';

// Leading placeholder shown when signing groups are available; selecting it clears the choice.
const SELECT_OPTION: SigningGroupOption = { id: '', name: 'Select Signing Group', keyName: '' };
// Sole option shown when the account has no signing groups; keeps the control present but empty.
const NONE_OPTION: SigningGroupOption = { id: '', name: 'No signing groups available', keyName: '' };

// Builds the docusign/signing-groups request body from the SignSettings baseline. Missing fields
// coalesce to empty so the body is always well-formed. Pure — no Angular dependencies.
export function buildSigningGroupsRequest(signSettings: SignSettingsBaseline | null | undefined): SigningGroupsRequest {
  return {
    SignEnvironmentID: signSettings?.SignEnvironmentID ?? '',
    AccountID: (signSettings?.AccountID ?? '').toString(),
    SenderUserID: (signSettings?.SenderUserID ?? '').toString(),
    AuthUserID: (signSettings?.AuthUserID ?? '').toString()
  };
}

// Decorates the fetched signing groups into the select's options: a leading "Select Signing Group"
// placeholder when there are groups, otherwise a single "No signing groups available" entry. Presentation
// only — the reducer stores the raw groups; this keeps the labels out of the store. Pure.
export function buildSigningGroupOptions(groups: SigningGroupOption[] | null | undefined): SigningGroupOption[] {
  return groups && groups.length
    ? [SELECT_OPTION, ...groups]
    : [NONE_OPTION];
}
