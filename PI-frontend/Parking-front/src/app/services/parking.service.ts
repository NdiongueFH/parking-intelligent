import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Parking {
  nom_du_parking: string;
  adresse: string;
  latitude: number;
  longitude: number;
  capaciteTotale: number;
  placesLibres?: number;
  placesReservees?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParkingService {
  private apiUrl = 'http://localhost:3000/api/v1/parkings';

  constructor(private http: HttpClient) { }

  getAllParkings(): Observable<Parking[]> {
    return this.http.get<Parking[]>(this.apiUrl);
  }

  getParkingById(id: string): Observable<Parking> {
    return this.http.get<Parking>(`${this.apiUrl}/${id}`);
  }

  getParkingByName(name: string): Observable<Parking> {
    return this.http.get<Parking>(`${this.apiUrl}/nom/${name}`);
  }

  addParking(parking: Parking): Observable<any> {
    return this.http.post(this.apiUrl, parking);
  }

  updateParking(id: string, parking: Parking): Observable<Parking> {
    return this.http.put<Parking>(`${this.apiUrl}/${id}`, parking);
  }

  deleteParking(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}