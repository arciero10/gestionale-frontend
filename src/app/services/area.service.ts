import { AreaKanban, AreaUI } from "@/models/macro-area";
import { mapAreaGetAll } from "@/models/mappers";
import { HttpClient, httpResource, HttpResourceRef } from "@angular/common/http";
import { inject, Injectable, Signal } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable(
  { providedIn: 'root' }
)
export class AreaService {
  private apiUrl = `${environment.apiBaseUrl}/Areas`;

  getAreaByType(type: Signal<number>) {
    return httpResource<AreaUI[]>(() => ({
      url: `${this.apiUrl}/${type()}`,
      method: 'GET',
      parse: (raw: AreaKanban[]) => raw.map(mapAreaGetAll),
    }));
  }


  isMobileDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || /(android)/i.test(navigator.userAgent);
  }
}