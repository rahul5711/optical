import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/role';


  roleSave( Name: any,Permission: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/save',{Name:Name,Permission:Permission})
    .pipe(catchError(this.handleError));
  }

  deleteRole(ID:any ): Observable<any> {
    return this.httpClient.post<any>(this.url + '/delete', {ID: ID})
    .pipe(catchError(this.handleError));
  }

  getList(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getList',Body)
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
