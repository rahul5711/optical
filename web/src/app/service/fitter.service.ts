import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FitterService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/fitter';


  saveFitter( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/save', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getFitterById(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getFitterById', {ID: ID},  { headers, params })
    .pipe(catchError(this.handleError));
  }

  updateFitter( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/update', Body, { headers, params })
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

  saveRateCard( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/saveRateCard', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }
  
  deleteRateCard(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/deleteRateCard', {ID: ID},  { headers, params })
    .pipe(catchError(this.handleError));
  }

  saveFitterAssignedShop( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/saveFitterAssignedShop', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  deleteFitterAssignedShop(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/deleteFitterAssignedShop', {ID: ID},  { headers, params })
    .pipe(catchError(this.handleError));
  }
 
  searchByFeild(searchQuery: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery)
    .pipe(catchError(this.handleError));
  }

  dropdownlist(): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.get<any>(this.url + '/dropdownlist', { headers, params })
    .pipe(catchError(this.handleError));
  }

  getRateCard(FitterID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getRateCard', {FitterID: FitterID}, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getFitterInvoice(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getFitterInvoice', {ID:ID}, { headers, params })
    .pipe(catchError(this.handleError));
  }

  saveFitterInvoice(Body:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/saveFitterInvoice', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getFitterInvoiceList(Body:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getFitterInvoiceList', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getFitterInvoiceListByID(FitterID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getFitterInvoiceListByID', {FitterID:FitterID}, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getFitterInvoiceDetailByID(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getFitterInvoiceDetailByID', {ID:ID}, { headers, params })
    .pipe(catchError(this.handleError));
  }

  updateFitterInvoiceNo(ID:any,InvoiceNo:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/updateFitterInvoiceNo', {ID:ID,InvoiceNo:InvoiceNo}, { headers, params })
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
