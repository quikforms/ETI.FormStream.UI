import { Action } from "@ngrx/store";

export const SET_AUTH_TOKENS = '[Form Stream Token] SET AUTH TOKENS';
export const REFRESH_AUTH_TOKENS = '[Form Stream Token] REFRESH AUTH TOKENS';

export class SetTokens implements Action {
  readonly type = SET_AUTH_TOKENS;
  constructor(public accessToken: string, public refreshToken: string) {}
}

export class RefreshTokens implements Action {
  readonly type = REFRESH_AUTH_TOKENS;
  constructor(public accessToken: string, public refreshToken: string) {}
}

export type AuthActions = SetTokens | RefreshTokens;