import { createFeatureSelector, createSelector } from "@ngrx/store";
import { AuthActions, REFRESH_AUTH_TOKENS, SET_AUTH_TOKENS } from "../actions/auth-token.actions";

export interface AuthTokenState {
  accessToken: string;
  refreshToken: string;
}

const initialState: AuthTokenState = {
  accessToken: '',
  refreshToken: ''
};

const selectFeature = createFeatureSelector<AuthTokenState>('authTokenReducer');

export const AuthTokenSelectors = {
    getAccessToken: createSelector(selectFeature, (state: AuthTokenState) => state && state.accessToken),
    getRefreshToken: createSelector(selectFeature, (state: AuthTokenState) => state && state.refreshToken)
}

export function AuthTokenReducer(
    state = initialState, 
    action: AuthActions): AuthTokenState 
{
    switch (action.type) {
      case SET_AUTH_TOKENS:
      case REFRESH_AUTH_TOKENS:        
        return {
          ...state,
          accessToken: action.accessToken,
          refreshToken: action.refreshToken
        };
      default:
        return state;
    }
}