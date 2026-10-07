import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { catchError, map, mergeMap, withLatestFrom } from "rxjs/operators";
import { of as observableOf } from 'rxjs';
import { QfHttpService } from "../../services/qf-http.service";
import { ConfigurationSelectors } from "../reducers/configuration.reducer";
import {
    LoadIdentityVerificationsFail,
    LoadIdentityVerificationsSuccess,
    TRY_LOAD_IDENTITY_VERIFICATIONS,
    TryLoadIdentityVerifications
} from "../actions/identity-verifications.actions";
import { hasPhoneAuthentication } from "../models/esign/identity-verifications.model";

@Injectable()
export class IdentityVerificationsEffects {

    constructor(
        private _actions: Actions,
        private _store: Store<any>,
        private _http: QfHttpService,
    ) { }

    tryLoadIdentityVerifications = createEffect(() => this._actions
        .pipe(
            ofType<TryLoadIdentityVerifications>(TRY_LOAD_IDENTITY_VERIFICATIONS),
            withLatestFrom(this._store.select(ConfigurationSelectors.selectFeature_Endpoints)),
            // mergeMap, not switchMap: two elements may ask about different accounts at the same time, and
            // one lookup must not cancel the other.
            mergeMap(([action, endpoints]) => {
                // Every request ends in Success or Fail, so the loading state always settles. Without an
                // endpoint there is nothing to ask, which reads as not supported.
                const url = endpoints?.esign?.identityVerifications;
                if (!url) {
                    return observableOf(new LoadIdentityVerificationsFail(action.key, 'No identity-verifications endpoint configured'));
                }
                return this._http.post(url, action.request)
                    .pipe(
                        map(response => new LoadIdentityVerificationsSuccess(action.key, hasPhoneAuthentication(response))),
                        // Phone authentication is an extra option: a failed lookup hides it, never blocks
                        // the modal.
                        catchError(error => observableOf(new LoadIdentityVerificationsFail(action.key, error)))
                    );
            })
        )
    );
}
