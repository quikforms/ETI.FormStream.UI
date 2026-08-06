import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { catchError, map, switchMap, withLatestFrom } from "rxjs/operators";
import { of as observableOf } from 'rxjs';
import { PRINT_FORMS_FAIL, PRINT_FORMS_SUCCESS, PrintFormsFail, PrintFormsSuccess, SAVE_FORMS_FAIL, SAVE_FORMS_SUCCESS, SaveFormsFail, SaveFormsSuccess, TRY_PRINT_FORMS, TRY_SAVE_FORMS, TryPrintForms, TrySaveForms } from "../actions/formstream.actions";
import { QfHttpService } from "../../services/qf-http.service";
import { ConfigurationSelectors } from "../reducers/configuration.reducer";
import { SetErrorNotification, SetSuccessNotification } from "../actions/notification.actions";
import { extractApiErrorMessage } from "./api-error.util";

@Injectable()
export class FormStreamEffects {

    constructor(
        private _actions: Actions,
        private _store: Store<any>,
        private _http:  QfHttpService,
    ) { }

    trySaveForms = createEffect(() => this._actions
        .pipe(
            ofType<TrySaveForms>(TRY_SAVE_FORMS),
            withLatestFrom(
                this._store.select(ConfigurationSelectors.selectFeature_Endpoints)
            ),
            switchMap(([action, endpoints]) => {

                return this._http.post(endpoints.qfe.saveForms, action.requestBody)
                    .pipe(
                        map(response => {
                            return new SaveFormsSuccess();
                        }),
                        catchError(error => observableOf(new SaveFormsFail(error)))
                    )
            })
        )
    );

    saveFormsSuccess = createEffect(() => this._actions
        .pipe(
            ofType<SaveFormsSuccess>(SAVE_FORMS_SUCCESS),
            map(action =>
                new SetSuccessNotification('Forms saved successfully.')
            )
        )
    );

    saveFormFail = createEffect(() => this._actions
        .pipe(
            ofType<SaveFormsFail>(SAVE_FORMS_FAIL),
            map(action =>
                new SetErrorNotification(extractApiErrorMessage(action.error, 'An error occurred while saving forms'))
            )
        )
    );


    tryPrintForms = createEffect(() => this._actions
        .pipe(
            ofType<TryPrintForms>(TRY_PRINT_FORMS),
            withLatestFrom(
                this._store.select(ConfigurationSelectors.selectFeature_Endpoints)
            ),
            switchMap(([action, endpoints]) => {

                const formData = new FormData();
                formData.append('formData', JSON.stringify(action.requestBody));

                return this._http.postFileDownload(endpoints.qfe.printForms, formData)
                    .pipe(
                        map(response => {
                            return new PrintFormsSuccess(response);
                        }),
                        catchError(error => observableOf(new PrintFormsFail(error)))
                    )
            })
        )
    );

    printFormsSuccess = createEffect(() => this._actions
        .pipe(
            ofType<PrintFormsSuccess>(PRINT_FORMS_SUCCESS),
            map(action => {

                if (!action.file) {
                    return new SetErrorNotification('No file received for download');
                }

                const blob = action.file;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'QuikForms.pdf';
                link.click();
                window.URL.revokeObjectURL(url);

                return new SetSuccessNotification('Forms downloaded successfully.');
            })
        )
    );

    printFormsFail = createEffect(() => this._actions
        .pipe(
            ofType<PrintFormsFail>(PRINT_FORMS_FAIL),
            map(action =>
                new SetErrorNotification(extractApiErrorMessage(action.error, 'An error occurred while printing forms'))
            )
        )
    );
}
