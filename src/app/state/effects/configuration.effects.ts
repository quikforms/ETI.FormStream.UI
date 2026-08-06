import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Action } from "@ngrx/store";
import { Observable } from 'rxjs';
import { map } from "rxjs/operators";
import { FormStreamConfigLoaded, TRY_LOAD_FORM_STREAM_CONFIGURATION, TryLoadFormStreamConfig } from "../actions/configuration.actions";
import { Configuration } from "../models/configuration.model";
import { environment } from "../../../environments/environment";

@Injectable()
export class ConfigurationEffects {

    // Production configuration is baked into the build (see src/environments); no runtime fetch.
    // A first-party host may pass a partial override through the action to retarget a non-production
    // embedding: it is merged over the baked production base URLs per key, so any key the host omits
    // keeps its production value and a public consumer (no override) gets production unchanged.
    configAttempt: Observable<Action> = createEffect(() => this._actions
        .pipe(
            ofType<TryLoadFormStreamConfig>(TRY_LOAD_FORM_STREAM_CONFIGURATION),
            map(action => {
                const api = { ...environment.api, ...(action.apiOverride ?? {}) };
                return new FormStreamConfigLoaded(Configuration.fromResponse({ api }));
            })
        ));

    constructor(private _actions: Actions) { }

}
