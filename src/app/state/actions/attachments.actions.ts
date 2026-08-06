import { Action } from "@ngrx/store";
import { AttachedFile, SelectedFile } from "../models/attached-file.model";

export const TRY_UPLOAD_FILES = '[Form Stream Attachments] TRY UPLOAD FILES';
export const UPLOAD_FILES_SUCCESS = '[Form Stream Attachments] UPLOAD FILES SUCCESS';
export const UPLOAD_FILES_FAIL = '[Form Stream Attachments] UPLOAD FILES FAIL';

export const TRY_REMOVE_UPLOADED_FILE = '[Form Stream Attachments] TRY REMOVED UPLOADED FILE';
export const REMOVE_UPLOADED_FILE_SUCCESS = '[Form Stream Attachments] REMOVE UPLOADED FILE SUCCESS';
export const REMOVE_UPLOADED_FILE_FAIL = '[Form Stream Attachments] REMOVE UPLOADED FILE FAIL';

export const TRY_LOAD_ATTACHMENTS = '[Form Stream Attachments] TRY LOAD ATTACHMENTS';
export const LOAD_ATTACHMENTS_SUCCESS = '[Form Stream Attachments] LOAD ATTACHMENTS SUCCESS';
export const LOAD_ATTACHMENTS_FAIL = '[Form Stream Attachments] LOAD ATTACHMENTS FAIL';

export const TRY_SELECT_FILES = '[Form Stream Attachments] TRY SELECT FILES';
export const SELECT_FILES_SUCCESS = '[Form Stream Attachments] SELECT FILES SUCCESS';
export const SELECT_FILES_FAIL = '[Form Stream Attachments] SELECT FILES FAIL';

export const TRY_REMOVE_SELECTED_FILE = '[Form Stream Attachments] TRY REMOVE SELECTED FILE';
export const REMOVE_SELECTED_FILE_SUCCESS = '[Form Stream Attachments] REMOVE SELECTED FILE SUCCESS';
export const REMOVE_SELECTED_FILE_FAIL = '[Form Stream Attachments] REMOVE SELECTED FILE FAIL';

export const CLEAR_SELECTED_FILES = '[Form Stream Attachments] CLEAR SELECTED FILES';

export const SET_ATTACHMENTS = '[Form Stream Attachments] SET ATTACHMENTS';

export class TryUploadFiles implements Action {
    readonly type = TRY_UPLOAD_FILES;
    constructor(
        public unid: string,
        public addBeforeForms: boolean        
    ) {}
}
export class UploadFilesSuccess implements Action {
    readonly type = UPLOAD_FILES_SUCCESS;
    constructor(public attachedFiles: AttachedFile []) {}
}

export class UploadFilesFail implements Action {
    readonly type = UPLOAD_FILES_FAIL;
    constructor(public error: any) {}
}

export class TryRemoveUploadedFile implements Action {
    readonly type = TRY_REMOVE_UPLOADED_FILE;
    constructor(public unid: string, public fileId: number) {}
}

export class RemoveUploadedFileSuccess implements Action {
    readonly type = REMOVE_UPLOADED_FILE_SUCCESS;
    constructor(public fileId: number) {}
}

export class RemoveUploadedFileFail implements Action {
    readonly type = REMOVE_UPLOADED_FILE_FAIL;
    constructor(public error: any) {}
}

export class TryLoadAttachments implements Action {
    readonly type = TRY_LOAD_ATTACHMENTS;
    constructor(public unid: string) {}
}

export class LoadAttachmentsSuccess implements Action {
    readonly type = LOAD_ATTACHMENTS_SUCCESS;
    constructor(public attachedFiles: AttachedFile []) {}
}

export class LoadAttachmentsFail implements Action {
    readonly type = LOAD_ATTACHMENTS_FAIL;
    constructor(public error: any) {}
}

export class TrySelectFiles implements Action {
    readonly type = TRY_SELECT_FILES;
    constructor(public files: SelectedFile []) {}
}

export class SelectFilesSuccess implements Action {
    readonly type = SELECT_FILES_SUCCESS;
    constructor() {}
}

export class SelectFilesFail implements Action {
    readonly type = SELECT_FILES_FAIL;
    constructor(public error: any) {}
}   

export class TryRemoveSelectedFile implements Action {
    readonly type = TRY_REMOVE_SELECTED_FILE;
    constructor(public selectedFileId: string) {}
}

export class RemoveSelectedFileSuccess implements Action {
    readonly type = REMOVE_SELECTED_FILE_SUCCESS;
    constructor() {}
}

export class RemoveSelectedFileFail implements Action {
    readonly type = REMOVE_SELECTED_FILE_FAIL;
    constructor(public error: any) {}
}

export class ClearSelectedFiles implements Action {
    readonly type = CLEAR_SELECTED_FILES;
    constructor() {}
}

export class SetAttachments implements Action {
    readonly type = SET_ATTACHMENTS;
    constructor(public attachedFiles: AttachedFile []) {}
}

export type AttachmentsActions = 
    TryUploadFiles | UploadFilesSuccess | UploadFilesFail |
    TryRemoveUploadedFile | RemoveUploadedFileSuccess | RemoveUploadedFileFail |
    TryLoadAttachments | LoadAttachmentsSuccess | LoadAttachmentsFail |
    TrySelectFiles | SelectFilesSuccess | SelectFilesFail |
    TryRemoveSelectedFile | RemoveSelectedFileSuccess | RemoveSelectedFileFail |
    ClearSelectedFiles |
    SetAttachments;