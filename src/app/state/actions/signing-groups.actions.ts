import { Action } from "@ngrx/store";
import { SigningGroupsRequest } from "../models/esign/signing-groups-request.model";
import { SigningGroupOption } from "../models/esign/signing-group-option.model";

export const TRY_LOAD_SIGNING_GROUPS = '[Form Stream Signing Groups] TRY LOAD SIGNING GROUPS';
export const LOAD_SIGNING_GROUPS_SUCCESS = '[Form Stream Signing Groups] LOAD SIGNING GROUPS SUCCESS';
export const LOAD_SIGNING_GROUPS_FAIL = '[Form Stream Signing Groups] LOAD SIGNING GROUPS FAIL';

export class TryLoadSigningGroups implements Action {
    readonly type = TRY_LOAD_SIGNING_GROUPS;
    constructor(public request: SigningGroupsRequest) {}
}

export class LoadSigningGroupsSuccess implements Action {
    readonly type = LOAD_SIGNING_GROUPS_SUCCESS;
    constructor(public groups: SigningGroupOption[]) {}
}

export class LoadSigningGroupsFail implements Action {
    readonly type = LOAD_SIGNING_GROUPS_FAIL;
    constructor(public error: any) {}
}

export type SigningGroupsActions
    = TryLoadSigningGroups
    | LoadSigningGroupsSuccess
    | LoadSigningGroupsFail;
