import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class UploaderService {

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000';


  uploadPurchase(file: File) {
    const fd = new FormData();
    // fd.append('docname', docname);
    // fd.append('mobile', mobile);
    fd.append('file', file, file.name);
    // console.log(fd);

    return this.httpClient.post(this.url + '/file/purchase', fd, {
      reportProgress: true,
      observe: 'events'
    });
  }

  saveFileRecord( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/saveFileRecord', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/list', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteFileRecord(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/deleteFileRecord', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  processPurchaseFile( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/processPurchaseFile', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  updateFileRecord( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/updateFileRecord', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  uploadCustomer(file: File) {
    const fd = new FormData();
    // fd.append('docname', docname);
    // fd.append('mobile', mobile);
    fd.append('file', file, file.name);
    // console.log(fd);

    return this.httpClient.post(this.url + '/file/customer', fd, {
      reportProgress: true,
      observe: 'events'
    });
  }

  processCustomerFile( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/processCustomerFile', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  uploadSpectacle(file: File) {
    const fd = new FormData();
    // fd.append('docname', docname);
    // fd.append('mobile', mobile);
    fd.append('file', file, file.name);
    // console.log(fd);

    return this.httpClient.post(this.url + '/file/customerPower', fd, {
      reportProgress: true,
      observe: 'events'
    });
  }

  processCusSpectacleFile( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/processCusSpectacleFile', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  processCusContactFile( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseUpload/processCusContactFile', Body, httpOptions )
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
