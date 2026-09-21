import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { map, catchError, switchMap, take, finalize, shareReplay, timeout } from 'rxjs/operators';
import { AuthTokenService } from './token.service';
import { Store } from '@ngrx/store';
import { ConfigurationSelectors } from '../state/reducers/configuration.reducer';

/**
 * How long a token renewal may take before it is treated as failed.
 *
 * Without a bound, a connection a proxy never answers leaves the renewal in flight forever, and the
 * one-at-a-time guard below would hand that same dead request to every later call for the rest of the
 * session, with nothing shown to the user.
 */
const REFRESH_TIMEOUT_MS = 30000;

@Injectable()
export class QfHttpService {

  private _refresh$: Observable<any> | null = null;

  constructor(
    private _http: HttpClient,
    private _tokenService: AuthTokenService,
    private _store: Store<any>
  ) { }


  public get(
    url: string,
    queryParams?: HttpParams
  ): Observable<any> {

    if (!url) {
      throw 'url cant be undefined';
    }

    const options = () => ({
      headers: this.getHeaders().set('Content-Type', 'application/json'),
      params: queryParams
    });

    return this.withTokenRetry(() => this._http.get(url, options())).pipe(
      map(this.apiResponse.bind(this))
    );
  }


  public post(url: string, data: any): Observable<any> {

    return this.withTokenRetry(() => this._http.post(url, data, { headers: this.getHeaders() })).pipe(
      map(this.apiResponse.bind(this))
    );
  }

  public put(url: string, data: any): Observable<any> {

    return this.withTokenRetry(() => this._http.put(url, data, { headers: this.getHeaders() })).pipe(
      map(this.apiResponse.bind(this))
    );
  }

  public delete(url: string, data?: any): Observable<any> {

    if (!url) {
      throw 'url cant be undefined';
    }

    const options = () => {

      let headers = this.getHeaders();
      let body = data;

      // Tested against null rather than for truthiness: an empty identifier is still a body the server
      // is meant to read and reject on its own terms, and dropping it sends a typeless empty request
      // that fails at model binding instead.
      if (data !== undefined && data !== null) {
        headers = headers.set('Content-Type', 'application/json');
        body = JSON.stringify(data);
      }

      return { headers: headers, body: body };
    };

    return this.withTokenRetry(() => this._http.delete(url, options())).pipe(
      map(this.apiResponse.bind(this))
    );
  }

  public postFileUpload(url: string, formData: FormData): Observable<any> {

    if (!url) {
      throw 'url cant be undefined';
    }

    // getHeaders() sets no Content-Type, so the browser still writes the multipart boundary itself.
    return this.withTokenRetry(() => this._http.post(url, formData, { headers: this.getHeaders() })).pipe(
      map(this.apiResponse.bind(this))
    );
  }

  /**
   * Sends a request, and if the caller's token is refused as unauthenticated, renews it once and sends
   * the request again.
   *
   * Takes a function rather than an observable so the request is rebuilt for the second attempt: the
   * Authorization header has to carry the token obtained by the renewal, not the one that was refused.
   *
   * Only 401 is retried. A token that authenticates but is not allowed to reach the route is refused
   * with 403, which renewing cannot change, and a second attempt would only spend the refresh token.
   */
  private withTokenRetry<T>(send: () => Observable<T>): Observable<T> {

    return send().pipe(
      catchError((error: HttpErrorResponse) => error.status === 401
        ? this.refreshToken().pipe(switchMap(send))
        : throwError(error))
    );
  }

  /**
   * Renews the access token, at most one renewal at a time.
   *
   * Every verb answers a 401 by coming here, so calls whose tokens expire together would otherwise start
   * a renewal each. The issuer replaces the refresh token on use — IdentityServer4 defaults a client's
   * refresh token usage to one-time-only and the token service does not override it — so the second
   * would present a handle the first had already spent. Sharing the request in flight makes every
   * waiting retry resume on the same new token.
   */
  private refreshToken(): Observable<any> {

    if (this._refresh$) {
      return this._refresh$;
    }

    const refreshToken = this._tokenService.getRefreshToken();

    // Nothing to renew with. Said plainly rather than posted: an empty grant comes back refused, which
    // reads exactly like an expired session and would send the user to reload a form that never had a
    // renewal path to begin with.
    if (!refreshToken) {
      return throwError(this.renewalFailure(
        null, 'This session cannot be renewed. Please reload the form to continue.'));
    }

    this._refresh$ = this._store.select(ConfigurationSelectors.selectFeature_Endpoints).pipe(
      // take(1) or this never completes: `select` stays open, so the retry chained onto it by each
      // caller would run again on any later configuration emission, and nothing would be released.
      take(1),
      switchMap(endpoints => this._http.post(
        endpoints.idp,
        this.refreshBody(refreshToken, endpoints.idpClientId),
        { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
      )),
      timeout(REFRESH_TIMEOUT_MS),
      map((response: any) => {
        // A 200 is not on its own a renewal. Anything that answers this call with a body of another
        // shape — a proxy's sign-in page, a wrapped envelope — would otherwise store an undefined token,
        // and every later request would go out with no Authorization header at all and be refused for a
        // reason that looks nothing like this one.
        if (!response || !response.access_token) {
          throw new Error('The token endpoint returned no access token.');
        }

        // The replacement refresh token is optional in the grant. Keeping the current one when none
        // comes back is what stops a renewal that worked from breaking the next one.
        this._tokenService.setTokens(
          response.access_token,
          response.refresh_token || refreshToken);

        return response;
      }),
      catchError((error: any) => {
        // Cleared here, not only in finalize. finalize runs after the error has finished reaching every
        // waiter, and shareReplay re-subscribes its source once it has seen an error — so a waiter that
        // reached this method from its own error handler would be handed this failed request back and
        // send a second one. Clearing before the error is visible closes that window.
        this._refresh$ = null;

        return throwError(this.renewalFailure(error));
      }),
      finalize(() => { this._refresh$ = null; }),
      shareReplay(1)
    );

    return this._refresh$;
  }

  /**
   * Turns a failed renewal into an error the caller's own failure handler can present.
   *
   * The message travels on the error rather than being raised here: every other failure in this
   * application is reported by the effect that owns the call, which is what lets a background load stay
   * silent and stops one failure producing two messages.
   */
  private renewalFailure(error: any, message?: string): HttpErrorResponse {

    const status: number = (error && typeof error.status === 'number') ? error.status : 0;
    const code = this.oauthErrorCode(error);

    // `invalid_grant` is a refresh token the issuer refused; the client errors mean the renewal names a
    // client it may not use. Neither improves by trying again, so they are told apart from a timeout or
    // a gateway fault, which does.
    const cannotRecover = (status === 400 || status === 401)
      && (code === 'invalid_grant' || code === 'invalid_client' || code === 'unauthorized_client');

    const text = message || (cannotRecover
      ? 'Your session has expired. Please reload the form to continue.'
      : 'Could not renew your session. Please try again.');

    return new HttpErrorResponse({
      error: { Message: text },
      status: status,
      statusText: (error && error.statusText) || 'Token renewal failed',
      url: (error && error.url) || undefined
    });
  }

  /**
   * Reads the OAuth error code out of a refused renewal.
   *
   * The body is only a parsed object when it arrived as JSON; a response the issuer or a gateway sends
   * as text reaches here as a raw string, which is why both shapes are read.
   */
  private oauthErrorCode(error: any): string {

    const body: any = error && error.error;

    if (typeof body === 'string') {
      return body.trim();
    }

    return (body && typeof body.error === 'string') ? body.error : '';
  }

  private refreshBody(refreshToken: string, clientId: string): string {

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    // Named only when the host supplied one. Where the issuer fills in a default this changes nothing;
    // where it does not, the request would otherwise arrive naming no client at all.
    if (clientId) {
      body.set('client_id', clientId);
    }

    return body.toString();
  }

  private getHeaders(): HttpHeaders {

    let headers = new HttpHeaders({
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    });

    const token = this._tokenService.getAccessToken();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  public postFormData(url: string, formData: FormData): Observable<any> {

    if (!url) {
      throw 'url cant be undefined';
    }

    const headers = new HttpHeaders({
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    });


    return this._http.post(url, formData, { headers }).pipe(
      map(this.apiResponse.bind(this))
    );
  }

  postFileDownload(url: string, formData: FormData): Observable<Blob> {

      return this.withTokenRetry(() => this._http.post(url, formData, {
          headers: this.getHeaders(),
          responseType: 'blob'
      })).pipe(
        catchError((error: HttpErrorResponse) => this.readableBlobError(error))
      );
  }

  /**
   * Re-raises a failed blob request with its body readable.
   *
   * Asking for a blob response means a refusal arrives as a blob too, and the message the server sent
   * with it is unreachable to anything that inspects the body — so every failure of this call would
   * otherwise be reported to the user as a generic one.
   */
  private readableBlobError(error: HttpErrorResponse): Observable<never> {

    const body: any = error && error.error;

    if (!(body instanceof Blob)) {
      return throwError(error);
    }

    return from(body.text()).pipe(
      switchMap(text => {
        let parsed: any = text;

        try {
          parsed = JSON.parse(text);
        } catch {
          // Not JSON: the text the server sent is itself the message.
        }

        return throwError(new HttpErrorResponse({
          error: parsed,
          status: error.status,
          statusText: error.statusText,
          url: error.url || undefined
        }));
      })
    );
  }

  private apiResponse(response: any): any {

    // A request answered with no content at all reaches here as null, which nothing below can read.
    if (response === null || response === undefined) {
      return '';
    }

    if (response.status === 204) {
      return '';
    }

    let possibleDataNames = ['ResultData', 'Data', 'data', 'resultData'];
    let data = response[possibleDataNames.filter(n => response[n] !== undefined)[0]];

    if (data === undefined) {
      return response;
    }

    return data;
  }
}
