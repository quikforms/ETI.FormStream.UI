import { Action } from "@ngrx/store";
import { EnvelopeSignRequest } from "../models/esign/envelope-sign-request.model";

export const TRY_SIGN_ENVELOPE = '[Form Stream Sign Envelope] TRY SIGN ENVELOPE';
export const SIGN_ENVELOPE_SUCCESS = '[Form Stream Sign Envelope] SIGN ENVELOPE SUCCESS';
export const SIGN_ENVELOPE_FAIL = '[Form Stream Sign Envelope] SIGN ENVELOPE FAIL';

export class TrySignEnvelope implements Action {
    readonly type = TRY_SIGN_ENVELOPE;
    constructor(public request: EnvelopeSignRequest) {}
}

export class SignEnvelopeSuccess implements Action {
    readonly type = SIGN_ENVELOPE_SUCCESS;
    constructor(public response: any) {}
}

export class SignEnvelopeFail implements Action {
    readonly type = SIGN_ENVELOPE_FAIL;
    constructor(public error: any) {}
}

export type SignEnvelopeActions
    = TrySignEnvelope
    | SignEnvelopeSuccess
    | SignEnvelopeFail;
