import { Action } from "@ngrx/store";
import { Configuration } from "../models/configuration.model";
import { ApiConfig } from "../../../environments/api-config";

export const TRY_LOAD_FORM_STREAM_CONFIGURATION = '[Form Stream Configuration] TRY LOAD FORM STREAM CONFIG';
export const FORM_STREAM_CONFIGURATION_LOAD_SUCCESS = '[Form Stream Configuration] LOAD FORM STREAM CONFIG SUCCESS';
export const FORM_STREAM_CONFIGURATION_LOAD_FAIL = '[Form Stream Configuration] LOAD FORM STREAM CONFIG FAIL';

export class TryLoadFormStreamConfig implements Action {
    readonly type = TRY_LOAD_FORM_STREAM_CONFIGURATION;

    // Optional per-key override of the baked production API base URLs, supplied by a first-party
    // host to point a non-production embedding at another environment. Keys left unset keep the
    // production defaults; a public consumer never provides this and stays on production.
    constructor (public apiOverride?: Partial<ApiConfig>) {}
}

export class FormStreamConfigLoaded implements Action {
    readonly type = FORM_STREAM_CONFIGURATION_LOAD_SUCCESS;
    constructor (public configuration: Configuration) {}
}

export class FormStreamConfigLoadFail implements Action {
    readonly type = FORM_STREAM_CONFIGURATION_LOAD_FAIL;
    constructor (public error: any) {}
}

export type ConfigurationActions
    = TryLoadFormStreamConfig
    | FormStreamConfigLoaded
    | FormStreamConfigLoadFail;
