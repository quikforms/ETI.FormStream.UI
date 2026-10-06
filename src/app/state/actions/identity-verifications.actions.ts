import { Action } from "@ngrx/store";
import { IdentityVerificationsRequest } from "../models/esign/identity-verifications.model";

export const TRY_LOAD_IDENTITY_VERIFICATIONS = '[Form Stream Identity Verifications] TRY LOAD IDENTITY VERIFICATIONS';
export const LOAD_IDENTITY_VERIFICATIONS_SUCCESS = '[Form Stream Identity Verifications] LOAD IDENTITY VERIFICATIONS SUCCESS';
export const LOAD_IDENTITY_VERIFICATIONS_FAIL = '[Form Stream Identity Verifications] LOAD IDENTITY VERIFICATIONS FAIL';
export const CLEAR_IDENTITY_VERIFICATIONS = '[Form Stream Identity Verifications] CLEAR IDENTITY VERIFICATIONS';

export class TryLoadIdentityVerifications implements Action {
    readonly type = TRY_LOAD_IDENTITY_VERIFICATIONS;
    constructor(public request: IdentityVerificationsRequest) {}
}

export class LoadIdentityVerificationsSuccess implements Action {
    readonly type = LOAD_IDENTITY_VERIFICATIONS_SUCCESS;
    constructor(public hasPhoneAuthentication: boolean) {}
}

export class LoadIdentityVerificationsFail implements Action {
    readonly type = LOAD_IDENTITY_VERIFICATIONS_FAIL;
    constructor(public error: any) {}
}

// Resets the capability when there is nothing to ask about (no DocuSign connection in the launch). The
// store is shared by every element on the page, so a modal that asks nothing must not inherit what
// another one loaded.
export class ClearIdentityVerifications implements Action {
    readonly type = CLEAR_IDENTITY_VERIFICATIONS;
}

export type IdentityVerificationsActions
    = TryLoadIdentityVerifications
    | LoadIdentityVerificationsSuccess
    | LoadIdentityVerificationsFail
    | ClearIdentityVerifications;
