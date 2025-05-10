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
export class ExpenseService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/expense';


  saveExpense( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/save', Body, { headers, params })
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

  getExpenseById(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getById', {ID: ID},  { headers, params })
    .pipe(catchError(this.handleError));
  }

  updateExpense( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/update', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery)
    .pipe(catchError(this.handleError));
  }

  getExpenseReport(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getExpenseReport', {Parem:Parem})
    .pipe(catchError(this.handleError));
  }


  getSaleReportMonthYearWise(Parem  :any,Type:any): Observable<any> {
      return this.httpClient.post<any>(this.url + '/getSaleReportMonthYearWise',{Parem :Parem,Type:Type }, httpOptions)
      .pipe(catchError(this.handleError));
    }
    getSaleReportMonthYearWiseDetails(BillMasterIds   :any): Observable<any> {
      return this.httpClient.post<any>(this.url + '/getSaleReportMonthYearWiseDetails',{BillMasterIds  :BillMasterIds  }, httpOptions)
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
