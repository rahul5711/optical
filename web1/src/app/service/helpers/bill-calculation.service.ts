import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class BillCalculationService {
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  constructor(
    private httpClient: HttpClient,
    private sp: NgxSpinnerService,) { }

  convertToDecimal(num: any, x: any) {
    return Number(Math.round(parseFloat(num + 'e' + x)) + 'e-' + x);
  }

 validateAndSetToZero(BillItem:any, property:any) {
    if (isNaN(Number(BillItem[property])) || BillItem[property] < 0) {
      alert("Please fill up a valid non-negative integer value for " + property);
      BillItem[property] = 0;
    }
  }

  calculations(fieldName: any, mode: any, BillItem: any, Service: any) {
    this.sp.show()
    const propertiesToValidate = ['UnitPrice', 'Quantity', 'DiscountPercentage', 'DiscountAmount', 'GSTPercentage', 'GSTAmount'];
    propertiesToValidate.forEach(property => this.validateAndSetToZero(BillItem, property));

    switch (mode) {
      case 'subTotal':
        if (BillItem.Quantity === null || BillItem.Quantity === '') {
          BillItem.Quantity = 0;
        } else {
          BillItem.GSTAmount = (+BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount) - ((+BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount) / (1 + +BillItem.GSTPercentage / 100));
        }
        if (BillItem.UnitPrice === null || BillItem.UnitPrice === '') {
          BillItem.UnitPrice = 0;
        }
        BillItem.SubTotal = +BillItem.Quantity * +BillItem.UnitPrice - BillItem.DiscountAmount;
        break;

      case 'discount':
        if (fieldName === 'DiscountPercentage') {
          if (Number(BillItem.DiscountPercentage) > 100) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give more than 100% discount`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            BillItem.DiscountPercentage = 0
          } else {
            BillItem.DiscountAmount = +BillItem.Quantity * +BillItem.UnitPrice * +BillItem.DiscountPercentage / 100;
          }
        }
        if (fieldName === 'DiscountAmount') {
          BillItem.DiscountPercentage = 100 * +BillItem.DiscountAmount / (+BillItem.Quantity * +BillItem.UnitPrice);
          if (Number(BillItem.DiscountPercentage) > 100) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give discount amount more than sub total`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            BillItem.DiscountAmount = 0
            BillItem.DiscountPercentage = 0
          } 
        }
        break;

      case 'gst':
        if (!BillItem.WholeSale) {
          if (fieldName === 'GSTPercentage') {
            if (BillItem.GSTPercentage === null || BillItem.GSTPercentage === '' || (Number(BillItem.GSTPercentage) > 100)) {
              Swal.fire({
                icon: 'warning',
                title: `You can't give more than 100% GSTPercentage`,
                text: ``,
                footer: '',
                backdrop: false,
              });
              BillItem.GSTPercentage = 0;
              BillItem.GSTType = 'None'
            } else {
              BillItem.GSTAmount = (+BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount) - ((+BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount) / (1 + +BillItem.GSTPercentage / 100));
            }
          }
          if (fieldName === 'GSTAmount') {
            BillItem.GSTPercentage = 100 * +BillItem.GSTAmount / (+BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount);
          }
        } else {
          if (fieldName === 'GSTPercentage') {
            if (BillItem.GSTPercentage === null || BillItem.GSTPercentage === '' || (Number(BillItem.GSTPercentage) > 100)) {
              Swal.fire({
                icon: 'warning',
                title: `You can't give more than 100% GSTPercentage`,
                text: ``,
                footer: '',
                backdrop: false,
              });
              BillItem.GSTPercentage = 0;
              BillItem.GSTType = 'None'
            }
            else {
              BillItem.GSTAmount = (+BillItem.Quantity * +BillItem.UnitPrice - BillItem.DiscountAmount) * +BillItem.GSTPercentage / 100;
            }
          }
          if (fieldName === 'GSTAmount') {
            if (BillItem.GSTAmount === null || BillItem.GSTAmount === '') {
              BillItem.GSTAmount = 0;
            } else {
              BillItem.GSTPercentage = 100 * +BillItem.GSTAmount / (+BillItem.Quantity * +BillItem.UnitPrice - BillItem.DiscountAmount);
            }
          }
        }
        break;

      case 'total':
        BillItem.TotalAmount = +BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount;
        BillItem.SubTotal = BillItem.TotalAmount - +BillItem.GSTAmount;
        break;

      // serviceCalcultion  
      
      case 'serviceSubTotal': 
      if (Service.Price === null || Service.Price === '') {
        Service.Price = 0;
      } else {
        Service.GSTAmount = (+Service.Price) - ((+Service.Price) / (1 + +Service.GSTPercentage / 100));
      }
      if (Service.Service === null || Service.Service === '') {
        Service.Service = 0;
      }
      Service.SubTotal = +Service.Price;
      break;

      case 'serviceGst':
      if (!BillItem.WholeSale) {
        if (fieldName === 'GSTPercentageSer') {
          if (Service.GSTPercentage === null || Service.GSTPercentage === '' || (Number(Service.GSTPercentage) > 100)) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give more than 100% GSTPercentage`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            Service.GSTPercentage = 0;
            Service.GSTType = 'None'
          } else {
            Service.GSTAmount = (+Service.Price) - ((+Service.Price) / (1 + +Service.GSTPercentage / 100));
          }
        }
        if (fieldName === 'GSTAmt') {
          Service.GSTPercentage = 100 * +Service.GSTAmount / (+Service.Price);
        }
      } else {
        if (fieldName === 'GSTPercentageSer') {
          if (Service.GSTPercentage === null || Service.GSTPercentage === '' || (Number(Service.GSTPercentage) > 100)) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give more than 100% GSTPercentage`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            Service.GSTPercentage = 0;
            Service.GSTType = 'None'
          }
          else {
            Service.GSTAmount = (+Service.Price) * +Service.GSTPercentage / 100;
          }
        }
        if (fieldName === 'GSTAmt') {
          if (Service.GSTAmount === null || Service.GSTAmount === '') {
            Service.GSTAmount = 0;
          } else {
            Service.GSTPercentage = 100 * +Service.GSTAmount / (+Service.Price);
          }
        }
      }
        break;

      case 'serviceTotal': 
      if (!BillItem.WholeSale) {
        Service.TotalAmount = +Service.Price;
        Service.SubTotal = +Service.TotalAmount - +Service.GSTAmount ;
      } else {
        Service.SubTotal = +Service.Price ;
        Service.TotalAmount = +Service.Price + +Service.GSTAmount;
      }
       

        Service.SubTotal = this.convertToDecimal(+Service.SubTotal, 2);
        Service.GSTPercentage = this.convertToDecimal(+Service.GSTPercentage, 2);
        Service.GSTAmount = this.convertToDecimal(+Service.GSTAmount, 2);
        Service.TotalAmount = this.convertToDecimal(+Service.TotalAmount, 2);
    
    }

 
    // serviceCalcultionEnd 

    // WholeSalecalculations
    if (!BillItem.WholeSale) {
      BillItem.TotalAmount = +BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount;
      BillItem.SubTotal = BillItem.TotalAmount - +BillItem.GSTAmount;
    } else {
      BillItem.SubTotal = +BillItem.Quantity * +BillItem.UnitPrice - +BillItem.DiscountAmount;
      BillItem.TotalAmount = +BillItem.SubTotal + +BillItem.GSTAmount;
    }

    BillItem.UnitPrice = this.convertToDecimal(+BillItem.UnitPrice, 2);
    BillItem.DiscountPercentage = this.convertToDecimal(+BillItem.DiscountPercentage, 2);
    BillItem.DiscountAmount = this.convertToDecimal(+BillItem.DiscountAmount, 2);
    BillItem.SubTotal = this.convertToDecimal(+BillItem.SubTotal, 2);
    BillItem.GSTPercentage = this.convertToDecimal(+BillItem.GSTPercentage, 2);
    BillItem.GSTAmount = this.convertToDecimal(+BillItem.GSTAmount, 2);
    BillItem.TotalAmount = this.convertToDecimal(+BillItem.TotalAmount, 2);
    this.sp.hide()
  }

  // bill Master calculation start
  calculateGrandTotal(BillMaster: any, billItemList: any, serviceLists: any) {

    BillMaster.Quantity = 0;
    BillMaster.SubTotal = 0;
    BillMaster.DiscountAmount = 0;
    BillMaster.GSTAmount = 0;
    BillMaster.TotalAmount = 0;
    BillMaster.DueAmount =  BillMaster.DueAmount + BillMaster.AddlDiscount

    billItemList.forEach((element: any) => {
      this.sp.show()
      if (element.Status !== 0) {
        BillMaster.Quantity = +BillMaster.Quantity + +element.Quantity;
        BillMaster.SubTotal = (+BillMaster.SubTotal + +element.SubTotal);
        BillMaster.DiscountAmount = (+BillMaster.DiscountAmount + +element.DiscountAmount);
        BillMaster.GSTAmount = (+BillMaster.GSTAmount + +element.GSTAmount);
        BillMaster.TotalAmount = (+BillMaster.TotalAmount + +element.TotalAmount);
      }

      if(element.DuaCal === 'yes'){
         element.DuaCal = 'No'
         BillMaster.DueAmount = +BillMaster.DueAmount + element.TotalAmount
      }

      if(element.DuaCal === 'delete'){
        BillMaster.DueAmount = +BillMaster.DueAmount -  element.TotalAmount 
     }
     
      if(element.DuaCal === 'delete2'){
        BillMaster.DueAmount = BillMaster.DueAmount - element.TotalAmount 
     }

     BillMaster.SubTotal = this.convertToDecimal(+BillMaster.SubTotal, 2);
     BillMaster.DiscountAmount = this.convertToDecimal(+BillMaster.DiscountAmount, 2);
     BillMaster.GSTAmount = this.convertToDecimal(+BillMaster.GSTAmount, 2);
     BillMaster.TotalAmount = this.convertToDecimal(+BillMaster.TotalAmount, 2);
     BillMaster.DueAmount = this.convertToDecimal(+BillMaster.DueAmount, 2);
     BillMaster.AddlDiscount = 0;
     BillMaster.AddlDiscountPercentage = 0;
     this.sp.hide()
    });

    // serviceList
    serviceLists.forEach((element: any) => {
      this.sp.show()
      if (element.Status !== 0) {
        BillMaster.SubTotal = +BillMaster.SubTotal + +element.SubTotal;
        BillMaster.GSTAmount = +BillMaster.GSTAmount + +element.GSTAmount;
        BillMaster.TotalAmount = +BillMaster.TotalAmount + +element.TotalAmount;
      }

      if(element.DuaCal === 'yes' ){
        element.DuaCal = 'No'
        BillMaster.DueAmount = +BillMaster.DueAmount +  element.TotalAmount
     }

     if(element.DuaCal === 'delete'){
       BillMaster.DueAmount = +BillMaster.DueAmount -  element.TotalAmount
    }
    if(element.DuaCal === 'delete2'){
      BillMaster.DueAmount = BillMaster.DueAmount -  element.TotalAmount
   }
   this.sp.hide()
    });

    // RoundOff
    if(this.companySetting.AppliedDiscount === "true"){
      let TotalAmt = '';
      TotalAmt = BillMaster.TotalAmount;
      BillMaster.TotalAmount = Math.round(BillMaster.TotalAmount);
      BillMaster.RoundOff = (BillMaster.TotalAmount - Number(TotalAmt)).toFixed(2); 
    }else{
      BillMaster.TotalAmount = BillMaster.TotalAmount;
      BillMaster.RoundOff = 0
    }
  };
  // bill Master calculation start


  AddDiscalculate(fieldName: any, mode: any, BillMaster: any,) {
    switch (mode) {
      case 'discount':
        if (fieldName === 'AddlDiscountPercentage') {
          if (BillMaster.AddlDiscountPercentage > 100) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give more than 100% Discount Percentage`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            BillMaster.AddlDiscountPercentage = 0
          } else {
            BillMaster.TotalAmount =+ BillMaster.SubTotal + BillMaster.GSTAmount;
            BillMaster.AddlDiscount =+ BillMaster.TotalAmount * +BillMaster.AddlDiscountPercentage / 100;
            BillMaster.TotalAmount =+ BillMaster.TotalAmount - BillMaster.AddlDiscount;
          }
        }
        if (fieldName === 'AddlDiscount') {
          if (BillMaster.AddlDiscount > BillMaster.TotalAmount) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give discount amount more than total amount`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            BillMaster.AddlDiscount = 0
          } else {
            BillMaster.TotalAmount =+ BillMaster.SubTotal + BillMaster.GSTAmount;
            BillMaster.AddlDiscountPercentage = 100 * +BillMaster.AddlDiscount / (+BillMaster.TotalAmount);
            BillMaster.TotalAmount =+ BillMaster.TotalAmount - BillMaster.AddlDiscount
          }
        }
        break;
    }
    BillMaster.AddlDiscountPercentage = this.convertToDecimal(+ BillMaster.AddlDiscountPercentage, 2);
    BillMaster.AddlDiscount = this.convertToDecimal(+BillMaster.AddlDiscount, 2);


    if(this.companySetting.AppliedDiscount === "true"){
      let TotalAmt = '';
      TotalAmt = BillMaster.TotalAmount;
      BillMaster.TotalAmount = Math.round(BillMaster.TotalAmount);
      BillMaster.RoundOff = (BillMaster.TotalAmount - Number(TotalAmt)).toFixed(2); 
    }else{
      BillMaster.TotalAmount = BillMaster.TotalAmount;
      BillMaster.RoundOff = 0
    }
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
