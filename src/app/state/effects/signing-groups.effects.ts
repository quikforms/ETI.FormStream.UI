import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { catchError, map, switchMap, withLatestFrom } from "rxjs/operators";
import { of as observableOf } from 'rxjs';
import { QfHttpService } from "../../services/qf-http.service";
import { ConfigurationSelectors } from "../reducers/configuration.reducer";
import { LoadSigningGroupsFail, LoadSigningGroupsSuccess, TRY_LOAD_SIGNING_GROUPS, TryLoadSigningGroups } from "../actions/signing-groups.actions";
import { SigningGroupOption } from "../models/esign/signing-group-option.model";

@Injectable()
export class SigningGroupsEffects {

    constructor(
        private _actions: Actions,
        private _store: Store<any>,
        private _http: QfHttpService,
    ) { }

    tryLoadSigningGroups = createEffect(() => this._actions
        .pipe(
            ofType<TryLoadSigningGroups>(TRY_LOAD_SIGNING_GROUPS),
            withLatestFrom(this._store.select(ConfigurationSelectors.selectFeature_Endpoints)),
            switchMap(([action, endpoints]) =>
                this._http.post(endpoints.esign.signingGroups, action.request)
                    .pipe(
                        map(response => new LoadSigningGroupsSuccess(mapGroups(response))),
                        // Signing groups are optional: a load failure degrades to "none available",
                        // never blocks the modal.
                        catchError(error => observableOf(new LoadSigningGroupsFail(error)))
                    )
            )
        )
    );
}

// Adapts the DocuSign response ({ groups: [{ signingGroupId, groupName }] }) to the UI option shape.
function mapGroups(response: any): SigningGroupOption[] {
    const groups = response?.groups || [];
    return groups.map((group: any): SigningGroupOption => ({
        id: group?.signingGroupId || '',
        name: group?.groupName || '',
        keyName: group?.signingGroupId || ''
    }));
}
