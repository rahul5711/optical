import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/customer';



  saveCustomer( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/save', Body)
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

  deleteSpec(ID:any,CustomerID:any,tablename:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/deleteSpec', {ID: ID,CustomerID: CustomerID,tablename: tablename},  { headers, params })
    .pipe(catchError(this.handleError));
  }

  getCustomerById(CustomerID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getCustomerById', {CustomerID: CustomerID},  { headers, params })
    .pipe(catchError(this.handleError));
  }
  
  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery)
    .pipe(catchError(this.handleError));
  }
  
  searchByCustomerID(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByCustomerID', searchQuery)
    .pipe(catchError(this.handleError));
  }

  updateCustomer( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/update', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  dropdownlist(): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/dropdownlist', { headers, params })
    .pipe(catchError(this.handleError));
  }

  customerGSTNumber( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/customerGSTNumber', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getMeasurementByCustomer( CustomerID: any, type:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/getMeasurementByCustomer', {CustomerID:CustomerID ,type:type}, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getMeasurementByCustomerForDropDown( CustomerID: any, type:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/getMeasurementByCustomerForDropDown', {CustomerID:CustomerID ,type:type}, { headers, params })
    .pipe(catchError(this.handleError));
  }

  customerPowerPDF(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/customerPowerPDF',Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  membershipCard(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/membershipCard',Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  customerSearch(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/customerSearch', Body , httpOptions)
    .pipe(catchError(this.handleError));
  }


  getEyeTestingReport(body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getEyeTestingReport',body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  exportCustomerData(body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/exportCustomerData',body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  exportCustomerPower(Type:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/exportCustomerPower',{Type:Type}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveCategory(CategoryID:any,Fromm:any,Too:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveCategory',{CategoryID:CategoryID,Fromm:Fromm,Too:Too}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCategoryList(): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCategoryList', httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteAllCategory(): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteAllCategory', httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCustomerCategory(CustomerID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerCategory',{CustomerID:CustomerID}, httpOptions)
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
