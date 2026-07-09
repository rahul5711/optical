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
export class PrintService {

  constructor(private httpClient: HttpClient) { }
   private url = environment.apiUrl + '/print';


     getDefaultPrinter(): Observable<any> {
       return this.httpClient.get<any>(this.url + '/getDefaultPrinter', httpOptions)
       .pipe(catchError(this.handleError));
     }

        printURL(Body: any): Observable<any> {
         return this.httpClient.post<any>(this.url + '/printURL', Body, httpOptions)
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
