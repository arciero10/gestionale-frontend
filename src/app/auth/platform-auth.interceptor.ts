import { Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { CapacitorHttp } from '@capacitor/core';
import { MsalInterceptor } from '@azure/msal-angular';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { MobileAuthService } from './mobile-auth.service';
import { getApiConfiguration } from './api-config';

@Injectable()
export class PlatformAuthInterceptor implements HttpInterceptor {
  private readonly injector = inject(Injector);
  private readonly mobile = inject(MobileAuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.mobile.native) return this.injector.get(MsalInterceptor).intercept(request, next);
    const target = new URL(request.url, window.location.origin);
    const api = new URL(getApiConfiguration().apiBaseUrl);
    if (target.origin !== api.origin || !target.pathname.startsWith(api.pathname.replace(/\/$/, '') + '/')) return next.handle(request);
    // Public endpoints remain usable anonymously; the server protects private APIs.
    if (!this.mobile.signedIn()) return this.sendNative(request.clone({ headers: request.headers.delete('Authorization') }), next);
    return from(this.mobile.accessToken()).pipe(
      switchMap(token => this.sendNative(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }), next)),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.mobile.logout();
        // No automatic replay of writes after an authentication failure.
        return throwError(() => error);
      })
    );
  }

  private sendNative(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.responseType !== 'json' || (typeof FormData !== 'undefined' && request.body instanceof FormData)) return next.handle(request);
    const headers: Record<string, string> = {};
    request.headers.keys().forEach(key => headers[key] = request.headers.get(key)!);
    if (request.body !== null && !request.headers.has('Content-Type')) headers['Content-Type'] = 'application/json';
    // Native HTTPS avoids WebView CORS. Server JWT validation is unchanged.
    return from(CapacitorHttp.request({ url: request.urlWithParams, method: request.method, headers,
      ...(request.body === null ? {} : { data: request.body }), responseType: 'json',
      disableRedirects: true, connectTimeout: 15000, readTimeout: 15000 })).pipe(switchMap(result => {
        if (result.status < 200 || result.status >= 300) return throwError(() => new HttpErrorResponse({ status: result.status, url: request.url, error: result.data }));
        return from([new HttpResponse({ status: result.status, body: result.data, headers: new HttpHeaders(result.headers), url: request.url })]);
      }));
  }
}
