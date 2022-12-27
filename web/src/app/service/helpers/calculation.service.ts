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
 
  // purchase details calculation start
  calculateFields(fieldName:any, mode:any, item:any, charges:any) {
      switch (mode) {

        case 'subTotal':
          item.SubTotal = +item.Quantity * +item.UnitPrice - +item.DiscountAmount;
        break;

        case 'discount':
          if (fieldName === 'DiscountPercentage') { 
            if(item.DiscountPercentage > 100 ) {
              alert("you can't give 100% above discount");
              item.DiscountPercentage = 0;
              item.DiscountAmount = 0;
              item.SubTotal = +item.UnitPrice * +item.Quantity - item.DiscountAmount;
            } else {
            item.DiscountAmount = +item.UnitPrice * +item.Quantity  * +item.DiscountPercentage / 100; 
            // items.DiscountPercentage =  +items.DiscountAmount * 100 / +items.UnitPrice * +items.Quantity; 
            item.SubTotal = +item.UnitPrice * +item.Quantity - +item.DiscountAmount;
            }
          }

          if (fieldName === 'DiscountAmount') {
            if(item.DiscountAmount > item.SubTotal) {
              alert("you can't give SubTotal above discount");
              item.DiscountAmount = 0;
            }else{
              item.DiscountPercentage = 100 * +item.DiscountAmount / (+item.Quantity * +item.UnitPrice);
              // items.DiscountAmount = +items.UnitPrice * +items.Quantity  * +items.DiscountPercentage / 100; 
              item.SubTotal = +item.UnitPrice * +item.Quantity - item.DiscountAmount;
            }
            // items.DiscountPercentage =  +items.DiscountAmount * 100 / +items.UnitPrice * +items.Quantity/100; 
          }
        break;

        case 'gst':
          if (fieldName === 'GSTPercentage') {
            if(Number(item.GSTPercentage) > 100 ) {
              alert("you can't give 100% above discount");
              item.GSTAmount = 0;
            }else{
              item.GSTAmount =(+item.UnitPrice * +item.Quantity - item.DiscountAmount) * +item.GSTPercentage / 100;
            }
          }
          if (fieldName === 'GSTAmount') {
             item.GSTPercentage =100 * +item.GSTAmount / (+item.SubTotal);
          }
        break;
  
        case 'total':
          item.TotalAmount = +item.SubTotal + +item.GSTAmount;
        break;
        
        // charges calculation start
        case 'chgst':
          if (fieldName === 'GSTPercentage') {
            charges.GSTAmount = (+charges.Price) * +charges.GSTPercentage / 100;
          }
          if (fieldName === 'GSTAmount') {
            charges.GSTPercentage = 100 * +charges.GSTAmount / (+charges.Price);
          }
        break;

        case 'chtotal':
          charges.TotalAmount = +charges.Price + +charges.GSTAmount;
        break;
        // charges calculation end
      }

      item.GSTAmount = this.convertToDecimal(+item.GSTAmount, 2);
      item.GSTPercentage = this.convertToDecimal(+item.GSTPercentage, 0);
      item.DiscountAmount = this.convertToDecimal(+item.DiscountAmount, 2);
      item.DiscountPercentage = this.convertToDecimal(+item.DiscountPercentage, 2);
      item.TotalAmount = this.convertToDecimal(+item.TotalAmount, 2);
      item.SubTotal = this.convertToDecimal(+item.SubTotal, 2);
  }
  // purchase details calculation end

  // purchase Master calculation start
  calculateGrandTotal(selectedPurchaseMaster:any, itemList:any, chargeList:any,  sgst:any, cgst:any, gstdividelist:any): any {
    selectedPurchaseMaster.Quantity = 0;
    selectedPurchaseMaster.SubTotal = 0;
    selectedPurchaseMaster.DiscountAmount = 0;
    selectedPurchaseMaster.GSTAmount = 0;
    selectedPurchaseMaster.TotalAmount = 0;
    sgst = 0;
    cgst = 0;
    gstdividelist.forEach((ele:any) => {
      ele.Amount = 0;
    })
   
    itemList.forEach((element: any) => {
      if (element.Status !== 0){
      selectedPurchaseMaster.Quantity = +selectedPurchaseMaster.Quantity + +element.Quantity;
      selectedPurchaseMaster.SubTotal = (+selectedPurchaseMaster.SubTotal + +element.SubTotal).toFixed(2);
      selectedPurchaseMaster.DiscountAmount = (+selectedPurchaseMaster.DiscountAmount + +element.DiscountAmount).toFixed(2);
      selectedPurchaseMaster.GSTAmount = (+selectedPurchaseMaster.GSTAmount + +element.GSTAmount);
      selectedPurchaseMaster.TotalAmount = (+selectedPurchaseMaster.TotalAmount + +element.TotalAmount).toFixed(2);
      }
      gstdividelist.forEach((ele: any) => {
        if(element.GSTType === ele.GstType && element.Status !== 0 && element.GSTType.toUpperCase() !== 'CGST-SGST') {
          ele.Amount =+ element.GSTAmount;
        }
      })
      if(element.Status !== 0 || element.GSTType.toUpperCase() === 'CGST-SGST') {
       sgst +=  element.GSTAmount / 2 ;
       cgst +=  element.GSTAmount / 2 ;
      }
    })

    chargeList.forEach((element: any ) => {
      if (element.Status !== 0){
        if(element.ID === null) {
          selectedPurchaseMaster.SubTotal = (+selectedPurchaseMaster.SubTotal + +element.Price).toFixed(2);
        }else{
          selectedPurchaseMaster.SubTotal = (+selectedPurchaseMaster.SubTotal + +element.Amount).toFixed(2);
        }
        selectedPurchaseMaster.GSTAmount = (+selectedPurchaseMaster.GSTAmount + +element.GSTAmount).toFixed(2);
        selectedPurchaseMaster.TotalAmount = (+selectedPurchaseMaster.TotalAmount + +element.TotalAmount).toFixed(2);
      }
      gstdividelist.forEach((ele: any) => {
        if(element.GSTType === ele.GstType && element.Status !== 0 && element.GSTType.toUpperCase() !== 'CGST-SGST') {
          ele.Amount += element.GSTAmount;
        } 
      })
      if(element.Status !== 0 && element.GSTType.toUpperCase() === 'CGST-SGST') {
        sgst +=  element.GSTAmount / 2 ;
        cgst +=  element.GSTAmount / 2 ;
      }
    })
  };


  
 // purchase Master calculation start

  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }

}
