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
    if(isNaN(Number(item.UnitPrice)) === true || item.UnitPrice < 0) {
      alert("please fill up integer value || not valid minus value ");
      item.UnitPrice = 0;
    }
    if(isNaN(Number(item.Quantity)) === true || item.Quantity < 0) {
      alert("please fill up integer value || not valid minus value");
      item.Quantity = 0;
    } 
    if(isNaN(Number(item.DiscountPercentage)) === true || item.DiscountPercentage < 0) {
      alert("please fill up integer value || not valid minus value");
      item.DiscountPercentage = 0;
    }
    if(isNaN(Number(item.DiscountAmount)) === true || item.DiscountAmount < 0) {
      alert("please fill up integer value || not valid minus value");
      item.DiscountAmount = 0;
    }
    if(isNaN(Number(item.GSTPercentage)) === true || item.GSTPercentage < 0) {
      alert("please fill up integer value || not valid minus value");
      item.GSTPercentage = 0;
    }
    if(isNaN(Number(item.GSTAmount)) === true || item.GSTAmount < 0) {
      alert("please fill up integer value || not valid minus value");
      item.GSTAmount = 0;
      item.GSTPercentage = 0;
      item.TotalAmount = 0;
    } else{
      switch (mode) {

        case 'subTotal':
          item.SubTotal = +item.Quantity * +item.UnitPrice - +item.DiscountAmount;
        break;

        case 'discount':
          if (fieldName === 'DiscountPercentage') { 
            if(Number(item.DiscountPercentage) > 100 ) {
              alert("you can't give 100% above Discount Percentage");
              item.DiscountPercentage = 0;
              item.DiscountAmount = 0;
              item.SubTotal = +item.UnitPrice * +item.Quantity - item.DiscountAmount;
            } else {
            item.DiscountAmount = +item.UnitPrice * +item.Quantity  * +item.DiscountPercentage / 100; 
            item.SubTotal = +item.UnitPrice * +item.Quantity - +item.DiscountAmount;
            }
          }

          if (fieldName === 'DiscountAmount') {
            if(item.DiscountAmount > item.SubTotal) {
              alert("you can't give SubTotal above discount");
              item.DiscountAmount = 0;
            }else{
              item.DiscountPercentage = 100 * +item.DiscountAmount / (+item.Quantity * +item.UnitPrice);
              item.SubTotal = +item.UnitPrice * +item.Quantity - item.DiscountAmount;
            }
          }
        break;

        case 'gst':
          if (fieldName === 'GSTPercentage') {
            if(Number(item.GSTPercentage) > 100 ) {
              alert("you can't give 100% above GST Percentage");
              item.GSTPercentage = 0;
              
            }else{
              item.GSTAmount =(+item.UnitPrice * +item.Quantity - item.DiscountAmount) * +item.GSTPercentage / 100;
            }
          }
          if (fieldName === 'GSTAmount' || item.GSTPercentage !== 0) {
             item.GSTPercentage =100 * +item.GSTAmount / (+item.SubTotal);
          }else{
            item.GSTType = 'None'
          }
        break;
  
        case 'total':
          item.TotalAmount = +item.SubTotal + +item.GSTAmount;  
        break;
        
        // charges calculation start
        case 'chgst':
          if (fieldName === 'GSTPercentage') {
            if(Number(charges.GSTPercentage) > 100 ) {
              alert("you can't give 100% above GST Percentage");
              charges.GSTPercentage = 0;
            }
            else{
              charges.GSTAmount = (+charges.Price) * +charges.GSTPercentage / 100;
            }
          }

          if (fieldName === 'GSTAmount' || charges.GSTPercentage !== 0) {
            charges.GSTPercentage = 100 * +charges.GSTAmount / (+charges.Price);
         }else{
          charges.GSTType = 'None'
         }

        break;

        case 'chtotal':
          charges.TotalAmount = +charges.Price + +charges.GSTAmount;
        break;
        // charges calculation end
      }
      if(item.GSTType !== "") {
        item.DiscountAmount = +item.UnitPrice * +item.Quantity  * +item.DiscountPercentage / 100; 
        item.GSTAmount =  (+item.UnitPrice * +item.Quantity - item.DiscountAmount) * +item.GSTPercentage / 100;
        item.SubTotal = +item.Quantity * +item.UnitPrice - +item.DiscountAmount;
        item.TotalAmount = +item.SubTotal + +item.GSTAmount;
      }

      item.GSTAmount = this.convertToDecimal(+item.GSTAmount, 2);
      item.GSTPercentage = this.convertToDecimal(+item.GSTPercentage, 0);
      item.DiscountAmount = this.convertToDecimal(+item.DiscountAmount, 2);
      item.DiscountPercentage = this.convertToDecimal(+item.DiscountPercentage, 2);
      item.TotalAmount = this.convertToDecimal(+item.TotalAmount, 2);
      item.SubTotal = this.convertToDecimal(+item.SubTotal, 2);
    }
  }
  // purchase details calculation end

  // purchase Master calculation start
  calculateGrandTotal(selectedPurchaseMaster:any, itemList:any, chargeList:any){
    selectedPurchaseMaster.Quantity = 0;
    selectedPurchaseMaster.SubTotal = 0;
    selectedPurchaseMaster.DiscountAmount = 0;
    selectedPurchaseMaster.GSTAmount = 0;
    selectedPurchaseMaster.TotalAmount = 0;
    // selectedPurchaseMaster.DueAmount = 0;
   
    itemList.forEach((element: any) => {
      if (element.Status !== 0){
      selectedPurchaseMaster.Quantity = +selectedPurchaseMaster.Quantity + +element.Quantity;
      selectedPurchaseMaster.SubTotal = (+selectedPurchaseMaster.SubTotal + +element.SubTotal).toFixed(2);
      selectedPurchaseMaster.DiscountAmount = (+selectedPurchaseMaster.DiscountAmount + +element.DiscountAmount).toFixed(2);
      selectedPurchaseMaster.GSTAmount = (+selectedPurchaseMaster.GSTAmount + +element.GSTAmount).toFixed(2);
      selectedPurchaseMaster.TotalAmount = (+selectedPurchaseMaster.TotalAmount + +element.TotalAmount).toFixed(2);
      // selectedPurchaseMaster.DueAmount = (+selectedPurchaseMaster.DueAmount + +element.TotalAmount).toFixed(2);
      }
    })

    // RoundOff
    let TotalAmt = '';
    TotalAmt = selectedPurchaseMaster.TotalAmount;
    selectedPurchaseMaster.TotalAmount = Math.round(selectedPurchaseMaster.TotalAmount);
    selectedPurchaseMaster.RoundOff = (selectedPurchaseMaster.TotalAmount - Number(TotalAmt)).toFixed(2);

    // chargeList
    if(chargeList !== ''){
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
      })
    }

  };
  // purchase Master calculation end


  //  convert to purchase calculation start

  calculateGrandTotals(selectedPurchaseMaster:any | number, itemList:any, chargeList:any ,gstdividelist:any){
    selectedPurchaseMaster.Quantity = 0;
    selectedPurchaseMaster.SubTotal = 0;
    selectedPurchaseMaster.DiscountAmount = 0;
    selectedPurchaseMaster.GSTAmount = 0;
    selectedPurchaseMaster.TotalAmount = 0;

   gstdividelist.forEach((ele: any) => {
      ele.Amount = 0;
    })

   itemList.forEach((element: any) => {
      if (element.Sel === 1) {
       gstdividelist.forEach((ele: any) => {
          if (ele.GSTType == element.GSTType   ) {
              ele.Amount = +ele.Amount + +element.GSTAmount;
          }
        })
        selectedPurchaseMaster.Quantity = +selectedPurchaseMaster.Quantity + +element.Quantity;
        selectedPurchaseMaster.SubTotal = +selectedPurchaseMaster.SubTotal + +element.SubTotal;
        selectedPurchaseMaster.DiscountAmount = +selectedPurchaseMaster.DiscountAmount + +element.DiscountAmount;
        selectedPurchaseMaster.GSTAmount = +selectedPurchaseMaster.GSTAmount + +element.GSTAmount;
        selectedPurchaseMaster.TotalAmount = +selectedPurchaseMaster.TotalAmount + +element.TotalAmount;
      }
    });
  };

  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }

}
