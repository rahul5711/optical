import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SupplierModel} from '../interface/Supplier';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000/supplier';


  supplierSave( Body: any): Observable<SupplierModel> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<SupplierModel>(this.url + '/save', Body, { headers, params })
    .pipe(catchError(this.handleError ));
  }

  supplierUpdate( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/update', Body, { headers, params })
    .pipe(catchError(this.handleError));
    
  }

  dropdownSupplierlist(): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.get<any>(this.url + '/dropdownlist')
    .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/list', Body, { params })
    .pipe(catchError(this.handleError));
  }

  deleteData(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/delete', {ID: ID},  { headers, params })
    .pipe(catchError(this.handleError));
  }

  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery)
    .pipe(catchError(this.handleError));
  }

  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }
  
}
