import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { RefreshTokens, SetTokens } from '../state/actions/auth-token.actions';
import { AuthTokenSelectors } from '../state/reducers/auth-token.reducer';


@Injectable()
export class AuthTokenService {

  constructor(private store: Store<any>) {}

  setTokens(accessToken: string, refreshToken: string): void {
    this.store.dispatch(new SetTokens(accessToken, refreshToken));
  }

  refreshTokens(accessToken: string, refreshToken: string): void {
    this.store.dispatch(new RefreshTokens(accessToken, refreshToken));
  }

  getAccessToken(): string {
    let token = '';
    this.store.select(AuthTokenSelectors.getAccessToken).subscribe(t => token = t).unsubscribe();    
    return token;
  }

  getRefreshToken(): string {
    let token = '';
    this.store.select(AuthTokenSelectors.getRefreshToken).subscribe(t => token = t).unsubscribe();
    return token;
  }
}
