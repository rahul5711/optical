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
export class ProductService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/product';


  productSave(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/save', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateProduct( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/update', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getList(): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getList', httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSpec(ProductName: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSpec', {ProductName : ProductName}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteProductType(ID:any,TableName:any  ): Observable<any> {
    return this.httpClient.post<any>(this.url + '/delete', {ID: ID,TableName: TableName}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteSpec(TableName:any,ID:any  ): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteSpec', {TableName: TableName,ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveSpec( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveSpec', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getFieldList(ProductName: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getFieldList', {ProductName :ProductName}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getProductSupportData(Ref:any, TableName: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getProductSupportData', {Ref: Ref, TableName :TableName}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveProductSupportData(TableName: any, Ref:any,SelectedValue:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveProductSupportData',{TableName :TableName, Ref: Ref,SelectedValue:SelectedValue}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteSpecValue(ID:any,TableName:any  ): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteSpec', {ID: ID,TableName: TableName}, httpOptions)
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
