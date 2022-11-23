import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CompanyModel } from '../interface/Company';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  loggedInUser:any = localStorage.getItem('LoggedINUser');

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000/file';


  uploadFile(file:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.httpClient.post<any>(this.url + '/upload',  fd, { headers, params })
    .pipe(catchError(this.handleError));
  }


  uploadFiles(file: any) {
    const fd = new FormData();
    // fd.append('docname', docname);
    // fd.append('mobile', mobile);
    fd.append('file', file, file.name);
    return this.httpClient.post(this.url + '/upload', fd, {
      reportProgress: true,
      observe: 'events'
    });
  }

  uploadFileComapny(file: any) {
    const fd = new FormData();
    // fd.append('docname', docname);
    // fd.append('mobile', mobile);
    fd.append('file', file, file.name);
    return this.httpClient.post(this.url + '/companyimage', fd, {
      reportProgress: true,
      observe: 'events'
    });
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
