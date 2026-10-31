import { Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
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
    if (target.origin !== api.origin) return next.handle(request);
    // Public endpoints remain usable anonymously; the server protects private APIs.
    if (!this.mobile.signedIn()) return next.handle(request.clone({ headers: request.headers.delete('Authorization') }));
    return from(this.mobile.accessToken()).pipe(
      switchMap(token => next.handle(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.mobile.logout();
        // No automatic replay of writes after an authentication failure.
        return throwError(() => error);
      })
    );
  }
}
