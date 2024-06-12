import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class QuotationService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/quotation';

  saveQuotation( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/create', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  updateQuotation( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/update', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  getPurchaseById(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseById', {ID: ID}, httpOptions )
    .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/list', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteData(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/delete', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery,httpOptions)
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
