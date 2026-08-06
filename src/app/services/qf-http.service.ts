import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthTokenService } from './token.service';
import { Store } from '@ngrx/store';
import { ConfigurationSelectors } from '../state/reducers/configuration.reducer';

@Injectable()
export class QfHttpService {

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

    const token = this._tokenService.getAccessToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const options = {
      headers: headers,
      params: queryParams
    };

    return this._http.get(url, options).pipe(
      map(this.apiResponse.bind(this)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => {
              const newToken = this._tokenService.getAccessToken();
              let newHeaders = new HttpHeaders({
                'Content-Type': 'application/json'
              });
              if (newToken) {
                newHeaders = newHeaders.set('Authorization', `Bearer ${newToken}`);
              }
              return this._http.get(url, { headers: newHeaders, params: queryParams });
            }),
            map(this.apiResponse.bind(this))
          );
        }
        return throwError(error);
      })
    );
  }



  public post(url: string, data: any): Observable<any> {
    
    return this._http.post(url, data, { headers: this.getHeaders() }).pipe(
      map(this.apiResponse.bind(this)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => this._http.post(url, data, { headers: this.getHeaders() })),
            map(this.apiResponse.bind(this))
          );
        }
        return throwError(error);
      })
    );

  }

  public put(url: string, data: any): Observable<any> {
    
    return this._http.put(url, data, { headers: this.getHeaders() }).pipe(
      map(this.apiResponse.bind(this)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => this._http.put(url, data, { headers: this.getHeaders() })),
            map(this.apiResponse.bind(this))
          );
        }
        return throwError(error);
      })
    );
    
  }

  public delete(url: string, data?: any): Observable<any> {

    if (!url) {
      throw 'url cant be undefined';
    }

    let headers = this.getHeaders();
    let body = data;

    if (data) {
      headers = headers.set('Content-Type', 'application/json');
      body = JSON.stringify(data);
    }

    const options = {
      headers: headers,
      body: body
    };

    return this._http.delete(url, options).pipe(
      map(this.apiResponse.bind(this)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => this._http.delete(url, options)),
            map(this.apiResponse.bind(this))
          );
        }
        return throwError(error);
      })
    );
  }

  public postFileUpload(url: string, formData: FormData): Observable<any> {
      
    if (!url) {
        throw 'url cant be undefined';
      }

      const token = this._tokenService.getAccessToken();
      let headers = new HttpHeaders();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }

      return this._http.post(url, formData, { headers }).pipe(
        map(this.apiResponse.bind(this))
      );
  }

  private refreshToken(): Observable<any> {
    
    const refreshData = {
      grant_type: 'refresh_token',
      refresh_token: this._tokenService.getRefreshToken()
    };

    return this._store.select(ConfigurationSelectors.selectFeature_Endpoints).pipe(
      switchMap(endpoints => 
        this._http.post(endpoints.idp, refreshData).pipe(
          switchMap((response: any) => {
            this._tokenService.setTokens(response.access_token, response.refresh_token);
            return new Observable(observer => observer.next(response));
          })
        )
      )
    );
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
      return this._http.post(url, formData, {
          headers: this.getHeaders(),
          responseType: 'blob'
      });
  }

  private apiResponse(response: any): any {
    
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
