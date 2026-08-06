import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { catchError, map, switchMap, withLatestFrom } from "rxjs/operators";
import { of as observableOf } from 'rxjs';
import { QfHttpService } from "../../services/qf-http.service";
import { ClearSelectedFiles, LOAD_ATTACHMENTS_FAIL, LoadAttachmentsFail, LoadAttachmentsSuccess, REMOVE_UPLOADED_FILE_FAIL, RemoveSelectedFileFail, RemoveSelectedFileSuccess, RemoveUploadedFileFail, RemoveUploadedFileSuccess, SelectFilesFail, SelectFilesSuccess, SetAttachments, TRY_LOAD_ATTACHMENTS, TRY_REMOVE_SELECTED_FILE, TRY_REMOVE_UPLOADED_FILE, TRY_SELECT_FILES, TRY_UPLOAD_FILES, TryLoadAttachments, TryRemoveSelectedFile, TryRemoveUploadedFile, TrySelectFiles, TryUploadFiles, UPLOAD_FILES_FAIL, UPLOAD_FILES_SUCCESS, UploadFilesFail, UploadFilesSuccess } from "../actions/attachments.actions";
import { SET_FORMSTREAM_DATA, SetFormStreamData } from "../actions/formstream.actions";
import { ConfigurationSelectors } from "../reducers/configuration.reducer";
import { AttachedFile } from "../models/attached-file.model";
import { AttachmentsSelectors } from "../reducers/attachments.reducer";
import { SetErrorNotification } from "../actions/notification.actions";
import { extractApiErrorMessage } from "./api-error.util";

@Injectable()
export class AttachmentsEffects {

    constructor(
        private _actions: Actions,        
        private _store: Store<any>,
        private _http:  QfHttpService,
    ) { }    

    // Seed the initial attachment list from the V2 intake payload. Reacting to the action
    // (not a store subscription) fires exactly once per intake, so it never clobbers files
    // the user uploads afterwards.
    seedAttachmentsFromPayload = createEffect(() => this._actions
        .pipe(
            ofType<SetFormStreamData>(SET_FORMSTREAM_DATA),
            map(action => new SetAttachments(action.formStreamData.transaction?.attachments ?? []))
        )
    );

    tryUploadFile = createEffect(() => this._actions
        .pipe(
            ofType<TryUploadFiles>(TRY_UPLOAD_FILES),
            withLatestFrom(
                this._store.select(ConfigurationSelectors.selectFeature_Endpoints),
                this._store.select(AttachmentsSelectors.getSelectedFiles)
            ),
            switchMap(([action, endpoints, selectedFiles]) => {
                
                const formData = new FormData();
                formData.append('unid', action.unid);
                formData.append('addBeforeForm', action.addBeforeForms.toString());

                selectedFiles.forEach((selectedFile, index) => {
                    formData.append('files', selectedFile.file);                    
                });

                return this._http.postFileUpload(endpoints.qfe.uploadAttachmentsUrl, formData)
                    .pipe(
                        map(response => { 
                            return new UploadFilesSuccess(response.map(item => AttachedFile.fromRaw(item)));
                        }),
                        catchError(error => observableOf(new UploadFilesFail(error)))
                    );
            })
        )
    );

    UploadFileSuccess = createEffect(() => this._actions
        .pipe(
            ofType<UploadFilesSuccess>(UPLOAD_FILES_SUCCESS),
            map(() => new ClearSelectedFiles())
        )
    );

    TrySelectFiles = createEffect(() => this._actions
        .pipe(
            ofType<TrySelectFiles>(TRY_SELECT_FILES),
            map(() => new SelectFilesSuccess()),
            catchError(error => observableOf(new SelectFilesFail(error)))
        )
    );

    TryRemoveSelectedFile = createEffect(() => this._actions
        .pipe(
            ofType<TryRemoveSelectedFile>(TRY_REMOVE_SELECTED_FILE),
            map(() => new RemoveSelectedFileSuccess()),
            catchError(error => observableOf(new RemoveSelectedFileFail(error)))
        )
    );

    tryRemoveUploadedFile = createEffect(() => this._actions
        .pipe(
            ofType<TryRemoveUploadedFile>(TRY_REMOVE_UPLOADED_FILE),
            withLatestFrom(this._store.select(ConfigurationSelectors.selectFeature_Endpoints)),
            switchMap(([action, endpoints]) => {
                                
                const deleteAttachmentUrl = endpoints.qfe.deleteAttachmentUrl.replace('{fileId}', action.fileId);
                
                return this._http.delete(deleteAttachmentUrl, action.unid)
                    .pipe(
                        map(response => {
                            return new RemoveUploadedFileSuccess(action.fileId);
                        }),
                        catchError(error => observableOf(new RemoveUploadedFileFail(error)))
                    );
            })
        )
    );

    tryLoadAttachments = createEffect(() => this._actions
        .pipe(
            ofType<TryLoadAttachments>(TRY_LOAD_ATTACHMENTS),
            withLatestFrom(this._store.select(ConfigurationSelectors.selectFeature_Endpoints)),
            switchMap(([action, endpoints]) => {
                
                const getAttachmentsUrl = `${endpoints.qfe.getAttachmentsUrl}?unid=${action.unid}`;

                return this._http.get(getAttachmentsUrl)
                    .pipe(
                        map(response => {
                            return new LoadAttachmentsSuccess(response.map(item => AttachedFile.fromRaw(item)));
                        }),
                        catchError(error => observableOf(new LoadAttachmentsFail(error)))
                    );
            })
        )
    );

    // Surface attachment API failures to the user as an error toast, mirroring the save/print flows.
    // Without these, the *Fail actions were dispatched but nothing was shown (e.g. an upload rejected
    // with 401 left the user with no feedback).
    uploadFilesFail = createEffect(() => this._actions
        .pipe(
            ofType<UploadFilesFail>(UPLOAD_FILES_FAIL),
            map(action =>
                new SetErrorNotification(extractApiErrorMessage(action.error, 'An error occurred while uploading attachments'))
            )
        )
    );

    removeUploadedFileFail = createEffect(() => this._actions
        .pipe(
            ofType<RemoveUploadedFileFail>(REMOVE_UPLOADED_FILE_FAIL),
            map(action =>
                new SetErrorNotification(extractApiErrorMessage(action.error, 'An error occurred while removing the attachment'))
            )
        )
    );

    loadAttachmentsFail = createEffect(() => this._actions
        .pipe(
            ofType<LoadAttachmentsFail>(LOAD_ATTACHMENTS_FAIL),
            map(action =>
                new SetErrorNotification(extractApiErrorMessage(action.error, 'An error occurred while loading attachments'))
            )
        )
    );
}