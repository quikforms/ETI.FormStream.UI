import { createFeatureSelector, createSelector } from "@ngrx/store";
import { buildIdCheckOptions, IdCheckKey } from "../models/esign/esign-auth-type.model";
import { EsignOption } from "../models/esign/esign-option.model";
import {
    IdentityVerificationsActions,
    LOAD_IDENTITY_VERIFICATIONS_FAIL,
    LOAD_IDENTITY_VERIFICATIONS_SUCCESS,
    TRY_LOAD_IDENTITY_VERIFICATIONS
} from "../actions/identity-verifications.actions";

const selectFeature = createFeatureSelector<IdentityVerificationsState>('identityVerificationsReducer');

// Whether a DocuSign account supports phone authentication, which decides whether "Passcode via SMS/Voice"
// is offered for it.
export interface AccountIdentityVerifications {
    capable: boolean;
    loading: boolean;
}

// The answers per account, by identityVerificationsKey. Kept per account because the store is shared by
// every element on the page: a dialog only ever reads the account it asked about.
export interface IdentityVerificationsState {
    accounts: { [key: string]: AccountIdentityVerifications };
}

// The two possible option lists, built once so a selector returns the same list while the answer does not
// change.
const ID_CHECK_OPTIONS_WITHOUT_PASSCODE = buildIdCheckOptions(false);
const ID_CHECK_OPTIONS_WITH_PASSCODE = buildIdCheckOptions(true);

const selectAccount = (key: string) => createSelector(selectFeature,
    (state: IdentityVerificationsState): AccountIdentityVerifications | undefined => state?.accounts?.[key]);

const selectHasPhoneAuthentication = (key: string) => createSelector(selectAccount(key),
    (account): boolean => !!account?.capable);

// Selector factories: each dialog creates its selectors once, for the account it asks about.
export const IdentityVerificationsSelectors = {
    selectHasPhoneAuthentication,
    selectIdentityVerificationsLoading: (key: string) => createSelector(selectAccount(key),
        (account): boolean => !!account?.loading),
    selectIdCheckOptions: (key: string) => createSelector(selectHasPhoneAuthentication(key),
        (hasPhoneAuthentication: boolean): EsignOption<IdCheckKey>[] =>
            hasPhoneAuthentication ? ID_CHECK_OPTIONS_WITH_PASSCODE : ID_CHECK_OPTIONS_WITHOUT_PASSCODE),
};

// The options for a dialog that has no account to ask about.
export const idCheckOptionsWithoutPhoneAuthentication = (): EsignOption<IdCheckKey>[] => ID_CHECK_OPTIONS_WITHOUT_PASSCODE;

export const initialIdentityVerificationsState: IdentityVerificationsState = {
    accounts: {}
};

const withAccount = (state: IdentityVerificationsState, key: string, account: AccountIdentityVerifications) =>
    ({ ...state, accounts: { ...state.accounts, [key]: account } });

export function IdentityVerificationsReducer(
    state: IdentityVerificationsState = initialIdentityVerificationsState,
    action: IdentityVerificationsActions
) {
    switch (action.type) {
        // Asking again about the same account keeps its previous answer until the new one arrives.
        case TRY_LOAD_IDENTITY_VERIFICATIONS:
            return withAccount(state, action.key, { capable: !!state.accounts[action.key]?.capable, loading: true });
        case LOAD_IDENTITY_VERIFICATIONS_SUCCESS:
            return withAccount(state, action.key, { capable: action.hasPhoneAuthentication, loading: false });
        // Not knowing reads as not supported: the option is hidden, never offered on a guess.
        case LOAD_IDENTITY_VERIFICATIONS_FAIL:
            return withAccount(state, action.key, { capable: false, loading: false });
        default:
            return state;
    }
}
