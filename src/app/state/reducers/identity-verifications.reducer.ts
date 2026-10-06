import { createFeatureSelector, createSelector } from "@ngrx/store";
import { buildIdCheckOptions, IdCheckKey } from "../models/esign/esign-auth-type.model";
import { EsignOption } from "../models/esign/esign-option.model";
import {
    CLEAR_IDENTITY_VERIFICATIONS,
    IdentityVerificationsActions,
    LOAD_IDENTITY_VERIFICATIONS_FAIL,
    LOAD_IDENTITY_VERIFICATIONS_SUCCESS,
    TRY_LOAD_IDENTITY_VERIFICATIONS
} from "../actions/identity-verifications.actions";

const selectFeature = createFeatureSelector<IdentityVerificationsState>('identityVerificationsReducer');

// Whether the connected DocuSign account supports phone authentication, which decides whether
// "Passcode via SMS/Voice" is offered.
export interface IdentityVerificationsState {
    capable: boolean;
    loading: boolean;
    failed: boolean;
}

const selectHasPhoneAuthentication = createSelector(selectFeature,
    (state: IdentityVerificationsState) => !!(state && state.capable));

// The ID Check options for the current account. Built here, not in the reducer, so the store holds only
// the capability; derived from the capability alone, so a new list is only produced when it changes.
const selectIdCheckOptions = createSelector(selectHasPhoneAuthentication,
    (hasPhoneAuthentication: boolean): EsignOption<IdCheckKey>[] => buildIdCheckOptions(hasPhoneAuthentication));

export const IdentityVerificationsSelectors = {
    selectIdCheckOptions,
    selectIdentityVerificationsLoading: createSelector(selectFeature,
        (state: IdentityVerificationsState) => !!(state && state.loading)),
    selectHasPhoneAuthentication,
};

export const initialIdentityVerificationsState: IdentityVerificationsState = {
    capable: false,
    loading: false,
    failed: false
};

export function IdentityVerificationsReducer(
    state: IdentityVerificationsState = initialIdentityVerificationsState,
    action: IdentityVerificationsActions
) {
    switch (action.type) {
        // A new request discards the previous answer: it may belong to another account.
        case TRY_LOAD_IDENTITY_VERIFICATIONS:
            return {
                ...state,
                capable: false,
                loading: true,
                failed: false
            };
        case LOAD_IDENTITY_VERIFICATIONS_SUCCESS:
            return {
                ...state,
                loading: false,
                capable: action.hasPhoneAuthentication
            };
        // Not knowing reads as not supported: the option is hidden, never offered on a guess.
        case LOAD_IDENTITY_VERIFICATIONS_FAIL:
            return {
                ...state,
                loading: false,
                failed: true,
                capable: false
            };
        case CLEAR_IDENTITY_VERIFICATIONS:
            return initialIdentityVerificationsState;
        default:
            return state;
    }
}
