import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { catchError, exhaustMap, map, withLatestFrom } from "rxjs/operators";
import { of as observableOf } from 'rxjs';
import { QfHttpService } from "../../services/qf-http.service";
import { ConfigurationSelectors } from "../reducers/configuration.reducer";
import { SetErrorNotification, SetSuccessNotification } from "../actions/notification.actions";
import { SIGN_ENVELOPE_FAIL, SIGN_ENVELOPE_SUCCESS, SignEnvelopeFail, SignEnvelopeSuccess, TRY_SIGN_ENVELOPE, TrySignEnvelope } from "../actions/sign-envelope.actions";
import { extractApiErrorMessage } from "./api-error.util";

@Injectable()
export class SignEnvelopeEffects {

    constructor(
        private _actions: Actions,
        private _store: Store<any>,
        private _http: QfHttpService,
    ) { }

    trySignEnvelope = createEffect(() => this._actions
        .pipe(
            ofType<TrySignEnvelope>(TRY_SIGN_ENVELOPE),
            withLatestFrom(this._store.select(ConfigurationSelectors.selectFeature_Endpoints)),
            // exhaustMap, not switchMap: sending is a mutating POST, so a second dispatch while one is
            // in flight must be ignored (first-request-wins), never cancel the in-flight request.
            exhaustMap(([action, endpoints]) =>
                this._http.post(endpoints.esign.envelopeSign, action.request)
                    .pipe(
                        map(response => new SignEnvelopeSuccess(response)),
                        catchError(error => observableOf(new SignEnvelopeFail(error)))
                    )
            )
        )
    );

    signEnvelopeSuccess = createEffect(() => this._actions
        .pipe(
            ofType<SignEnvelopeSuccess>(SIGN_ENVELOPE_SUCCESS),
            map(() => new SetSuccessNotification('Forms sent for signature successfully.'))
        )
    );

    signEnvelopeFail = createEffect(() => this._actions
        .pipe(
            ofType<SignEnvelopeFail>(SIGN_ENVELOPE_FAIL),
            map(action => new SetErrorNotification(
                extractApiErrorMessage(action.error, 'An error occurred while sending for signature')))
        )
    );
}
