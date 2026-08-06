import { Action } from "@ngrx/store";
import { PrintRequest } from "../models/DTOs/print-request.model";
import { FormStreamData } from "../models/Response/formstream-data.model";

export const SET_FORMSTREAM_DATA = '[FormStream] SET FORMSTREAM DATA';

export const TRY_UPDATE_FORM_FIELD = '[FormStream] TRY UPDATE FORM FIELD';


export const TRY_SAVE_FORMS = '[FormStream] TRY SAVE FORMS';
export const SAVE_FORMS_SUCCESS = '[FormStream] SAVE FORMS SUCCESS';
export const SAVE_FORMS_FAIL = '[FormStream] SAVE FORMS FAIL';

export const TRY_PRINT_FORMS = '[FormStream] TRY PRINT FORMS';
export const PRINT_FORMS_SUCCESS = '[FormStream] PRINT FORMS SUCCESS';
export const PRINT_FORMS_FAIL = '[FormStream] PRINT FORMS FAIL';


export class SetFormStreamData implements Action {
    readonly type = SET_FORMSTREAM_DATA;
    constructor(public formStreamData: FormStreamData) {}
}

export class TryUpdateFormField implements Action {
    readonly type = TRY_UPDATE_FORM_FIELD;
    constructor(
        public formId: number,
        public sectionId: number,
        public fieldId: number,
        public fieldValue: string,
    ) {}
}

export class TrySaveForms implements Action {
    readonly type = TRY_SAVE_FORMS;
    constructor(
        public requestBody: any
    ) {}
}

export class SaveFormsSuccess implements Action {
    readonly type = SAVE_FORMS_SUCCESS;
    constructor() {}
}

export class SaveFormsFail implements Action {
    readonly type = SAVE_FORMS_FAIL;
    constructor(public error: any) {}
}

export class TryPrintForms implements Action {
    readonly type = TRY_PRINT_FORMS;
    constructor(
        public requestBody: PrintRequest
    ) {}
}

export class PrintFormsSuccess implements Action {
    readonly type = PRINT_FORMS_SUCCESS;
    constructor(public file?: Blob) { }
}

export class PrintFormsFail implements Action {
    readonly type = PRINT_FORMS_FAIL;
    constructor(public error: any) {}
}

export type FormStreamActions =
    SetFormStreamData |
    TryUpdateFormField |
    TrySaveForms | SaveFormsSuccess | SaveFormsFail |
    TryPrintForms | PrintFormsSuccess | PrintFormsFail;