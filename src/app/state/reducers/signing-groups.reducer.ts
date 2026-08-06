import { createFeatureSelector, createSelector } from "@ngrx/store";
import { SigningGroupOption } from "../models/esign/signing-group-option.model";
import { buildSigningGroupOptions } from "../models/esign/signing-group.builder";
import { LOAD_SIGNING_GROUPS_FAIL, LOAD_SIGNING_GROUPS_SUCCESS, SigningGroupsActions, TRY_LOAD_SIGNING_GROUPS } from "../actions/signing-groups.actions";

const selectFeature = createFeatureSelector<SigningGroupsState>('signingGroupsReducer');

export interface SigningGroupsState {
    groups: SigningGroupOption[];
    loading: boolean;
    failed: boolean;
}

// The select options (raw groups decorated with the leading placeholder / empty label). Decoration
// lives here, not in the reducer, so the store holds only the fetched groups.
const selectSigningGroupOptions = createSelector(selectFeature,
    (state: SigningGroupsState) => buildSigningGroupOptions(state && state.groups));

export const SigningGroupsSelectors = {
    selectSigningGroupOptions,
    selectSigningGroupsLoading: createSelector(selectFeature,
        (state: SigningGroupsState) => !!(state && state.loading)),
    // True when at least one real group is available (the decorated options carry a leading
    // placeholder, so a real group means length > 1).
    selectHasSigningGroups: createSelector(selectSigningGroupOptions,
        (options: SigningGroupOption[]) => options.length > 1),
};

const initialState: SigningGroupsState = {
    groups: [],
    loading: false,
    failed: false
};

export function SigningGroupsReducer(
    state: SigningGroupsState = initialState,
    action: SigningGroupsActions
) {
    switch (action.type) {
        case TRY_LOAD_SIGNING_GROUPS:
            return {
                ...state,
                loading: true,
                failed: false
            };
        case LOAD_SIGNING_GROUPS_SUCCESS:
            return {
                ...state,
                loading: false,
                groups: action.groups
            };
        case LOAD_SIGNING_GROUPS_FAIL:
            return {
                ...state,
                loading: false,
                failed: true,
                groups: []
            };
        default:
            return state;
    }
}
