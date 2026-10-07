import { Action } from "@ngrx/store";
import { IdentityVerificationsRequest, identityVerificationsKey } from "../models/esign/identity-verifications.model";

export const TRY_LOAD_IDENTITY_VERIFICATIONS = '[Form Stream Identity Verifications] TRY LOAD IDENTITY VERIFICATIONS';
export const LOAD_IDENTITY_VERIFICATIONS_SUCCESS = '[Form Stream Identity Verifications] LOAD IDENTITY VERIFICATIONS SUCCESS';
export const LOAD_IDENTITY_VERIFICATIONS_FAIL = '[Form Stream Identity Verifications] LOAD IDENTITY VERIFICATIONS FAIL';

// Every action carries the key of the account it is about (see identityVerificationsKey), so an answer only
// ever lands on the account that was asked about.

export class TryLoadIdentityVerifications implements Action {
    readonly type = TRY_LOAD_IDENTITY_VERIFICATIONS;
    readonly key: string;
    constructor(public request: IdentityVerificationsRequest) {
        this.key = identityVerificationsKey(request);
    }
}

export class LoadIdentityVerificationsSuccess implements Action {
    readonly type = LOAD_IDENTITY_VERIFICATIONS_SUCCESS;
    constructor(public key: string, public hasPhoneAuthentication: boolean) {}
}

export class LoadIdentityVerificationsFail implements Action {
    readonly type = LOAD_IDENTITY_VERIFICATIONS_FAIL;
    constructor(public key: string, public error: any) {}
}

export type IdentityVerificationsActions
    = TryLoadIdentityVerifications
    | LoadIdentityVerificationsSuccess
    | LoadIdentityVerificationsFail;
