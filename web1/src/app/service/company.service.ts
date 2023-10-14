import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CompanyModel } from '../interface/Company';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})

export class CompanyService {

  loggedInUser:any = localStorage.getItem('LoggedINUser');
  private url = environment.apiUrl + '/company';

  constructor(private httpClient: HttpClient) { }
  
  
  createCompany( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/create', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateCompany( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/update', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCompanyById(ID:any): Observable<any> {;
    return this.httpClient.post<any>(this.url + '/getCompanyById', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteData(ID:any): Observable<any> {;
    return this.httpClient.post<any>(this.url + '/delete', {ID: ID},  httpOptions)
    .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/list', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getUserList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/user', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  getLoginList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/LoginHistory', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updatePassword(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePassword',  Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updatecompanysetting(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatecompanysetting',  Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery)
    .pipe(catchError(this.handleError));
  }

  searchByFeildAdmin(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeildAdmin', searchQuery)
    .pipe(catchError(this.handleError));
  }

  deactive(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deactive', {ID: ID},  httpOptions)
    .pipe(catchError(this.handleError));
  }


  activecompany(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/activecompany', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  Deactivelist(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/Deactivelist', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveBillFormate(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveBillFormate', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  getBillFormateById(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getBillFormateById', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  barcodeDetails(CompanyID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barcodeDetails', {CompanyID:CompanyID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  invoiceDetails(CompanyID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/invoiceDetails', {CompanyID:CompanyID}, httpOptions)
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
