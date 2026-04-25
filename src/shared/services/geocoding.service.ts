import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
    private http = inject(HttpClient);
    private base = '/api'; // proxy dal dev server o path reale

    forward(query: string, country = 'it'): Observable<any[]> {
        const params = new HttpParams().set('q', query).set('country', country);
        return this.http.get<any[]>(`${this.base}/geocode`, { params });
    }

    reverse(lat: number, lon: number): Observable<any> {
        const params = new HttpParams().set('lat', lat).set('lon', lon);
        return this.http.get<any>(`${this.base}/reverse`, { params });
    }
}
