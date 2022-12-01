import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor(private httpClient: HttpClient) { }

  convertToDecimal(num:any, x:any) {
    return Number(Math.round(parseFloat(num + 'e' + x)) + 'e-' + x);
  }
 
  calculateFields(fieldName:any, mode:any,itemss:any,charges:any) {
      switch (mode) {

        case 'subTotal':
          itemss.SubTotal = +itemss.Quantity * +itemss.UnitPrice - +itemss.DiscountAmount;
        break;

        case 'discount':
          if (fieldName === 'DiscountPercentage') { 
            if(itemss.DiscountPercentage > 100 ) {
              alert("you can't give 100% above discount");
              itemss.DiscountPercentage = 0;
              itemss.DiscountAmount = 0;
              itemss.SubTotal = +itemss.UnitPrice * +itemss.Quantity - itemss.DiscountAmount;
            } else {
            itemss.DiscountAmount = +itemss.UnitPrice * +itemss.Quantity  * +itemss.DiscountPercentage / 100; 
            // items.DiscountPercentage =  +items.DiscountAmount * 100 / +items.UnitPrice * +items.Quantity; 
            itemss.SubTotal = +itemss.UnitPrice * +itemss.Quantity - +itemss.DiscountAmount;
            }
          }

          if (fieldName === 'DiscountAmount') {
            if(itemss.DiscountAmount > itemss.SubTotal) {
              alert("you can't give SubTotal above discount");
              itemss.DiscountAmount = 0;
            }else{
              itemss.DiscountPercentage = 100 * +itemss.DiscountAmount / (+itemss.Quantity * +itemss.UnitPrice);
              // items.DiscountAmount = +items.UnitPrice * +items.Quantity  * +items.DiscountPercentage / 100; 
              itemss.SubTotal = +itemss.UnitPrice * +itemss.Quantity - itemss.DiscountAmount;
            }
            // items.DiscountPercentage =  +items.DiscountAmount * 100 / +items.UnitPrice * +items.Quantity/100; 
          }
        break;

        case 'gst':
          if (fieldName === 'GSTPercentage') {
            if(Number(itemss.GSTPercentage) > 100 ) {
              alert("you can't give 100% above discount");
              itemss.GSTAmount = 0;
            }else{
              itemss.GSTAmount =(+itemss.UnitPrice * +itemss.Quantity - itemss.DiscountAmount) * +itemss.GSTPercentage / 100;
            }
          }
          if (fieldName === 'GSTAmount') {
             itemss.GSTPercentage =100 * +itemss.GSTAmount / (+itemss.SubTotal);
          }
        break;
  
        case 'chgst':
          if (fieldName === 'GSTPercentage') {
            charges.GSTAmount = (+charges.Price) * +charges.GSTPercentage / 100;
          }
          if (fieldName === 'GSTAmount') {
            charges.GSTPercentage = 100 * +charges.GSTAmount / (+charges.Price);
          }
        break;

        case 'total':
          itemss.TotalAmount = +itemss.SubTotal + +itemss.GSTAmount;
        break;

        case 'chtotal':
          charges.TotalAmount = +charges.Price + +charges.GSTAmount;
        break;
      }

      itemss.GSTAmount = this.convertToDecimal(+itemss.GSTAmount, 2);
      itemss.GSTPercentage = this.convertToDecimal(+itemss.GSTPercentage, 0);
      itemss.DiscountAmount = this.convertToDecimal(+itemss.DiscountAmount, 2);
      itemss.DiscountPercentage = this.convertToDecimal(+itemss.DiscountPercentage, 2);
      itemss.TotalAmount = this.convertToDecimal(+itemss.TotalAmount, 2);
      itemss.SubTotal = this.convertToDecimal(+itemss.SubTotal, 2);
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
