import { createFeatureSelector, createSelector } from "@ngrx/store";
import { FormStreamData } from "../models/Response/formstream-data.model";
import { FormStreamActions, PRINT_FORMS_FAIL, PRINT_FORMS_SUCCESS, SAVE_FORMS_FAIL, SAVE_FORMS_SUCCESS, SET_FORMSTREAM_DATA, TRY_PRINT_FORMS, TRY_SAVE_FORMS } from "../actions/formstream.actions";

const selectFeature = createFeatureSelector<FormStreamState>('formStreamReducer');

export interface FormStreamState {
    formStreamData: FormStreamData | null,
    loading: boolean
}

export const FormStreamSelectors = {
    getFormStreamData: createSelector(selectFeature, (state: FormStreamState) => state ? state.formStreamData : null),
    isLoading: createSelector(selectFeature, (state: FormStreamState) => state ? state.loading : false)
}

const initialState: FormStreamState = {
    formStreamData: null,
    loading: false
};

export function FormStreamReducer(
    state: FormStreamState = initialState,
    action: FormStreamActions)
{
    switch (action.type) {
        case SET_FORMSTREAM_DATA:
            return {
                ...state,
                formStreamData: action.formStreamData
            };
        case TRY_SAVE_FORMS:
            return {
                ...state,
                loading: true
            };
        case SAVE_FORMS_SUCCESS:
            return {
                ...state,
                loading: false
            };
        case SAVE_FORMS_FAIL:
            return {
                ...state,
                loading: false
            };
        case TRY_PRINT_FORMS:
            return {
                ...state,
                loading: true
            };
        case PRINT_FORMS_SUCCESS:
            return {
                ...state,
                loading: false
            };
        case PRINT_FORMS_FAIL:
            return {
                ...state,
                loading: false
            };
        default:
            return state;
    }
}
