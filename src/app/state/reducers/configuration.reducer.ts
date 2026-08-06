import { createFeatureSelector, createSelector } from "@ngrx/store";
import { Configuration, Endpoints } from "../models/configuration.model";
import { ConfigurationActions, FORM_STREAM_CONFIGURATION_LOAD_SUCCESS } from "../actions/configuration.actions";

const selectFeature = createFeatureSelector<ConfigurationState>('configurationReducer');

export const ConfigurationSelectors = {
    selectFeature: selectFeature,
    selectFeature_Endpoints: createSelector(selectFeature, (state: ConfigurationState) => state && state.endpoints || null )
};

interface ConfigurationState {
    configuration: Configuration;
    endpoints: Endpoints;
}

const initialState: ConfigurationState = {
    configuration: null,
    endpoints: null
};


export function ConfigurationReducer (
    state: ConfigurationState = initialState,
    action: ConfigurationActions
    ) {
        switch (action.type) {
            case FORM_STREAM_CONFIGURATION_LOAD_SUCCESS:
                return {
                    ...state,
                    configuration: action.configuration,
                    endpoints: new Endpoints(action.configuration)
                };
            default:
                return state;
        }
    };
