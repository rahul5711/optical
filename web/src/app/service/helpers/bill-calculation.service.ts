import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class BillCalculationService {

  constructor(private httpClient: HttpClient) { }

  convertToDecimal(num: any, x: any) {
    return Number(Math.round(parseFloat(num + 'e' + x)) + 'e-' + x);
  }

  calculations(fieldName: any, mode: any, BillItem: any, Service: any) {

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
          if (Number(BillItem.DiscountAmount) > BillItem.SubTotal) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give discount amount more than sub total`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            BillItem.DiscountAmount = 0
          } else {
            BillItem.DiscountPercentage = 100 * +BillItem.DiscountAmount / (+BillItem.Quantity * +BillItem.UnitPrice);
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
      case 'serviceGst':
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
            // Service.GSTType = 'None'
          }
          else {
            Service.GSTAmount = +Service.Price * +Service.GSTPercentage / 100;
          }
        }

        if (fieldName === 'GSTAmountSer') {
          if (Service.GSTAmount === null || Service.GSTAmount === '') {
            Service.GSTAmount = 0;
          } else {
            Service.GSTPercentage = 100 * +Service.GSTAmount / (+Service.Price);
          }
        
        }
        break;

      case 'serviceTotal': 
        Service.TotalAmount = +Service.GSTAmount + +Service.Price;
        break;
    }

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

  }

  // bill Master calculation start
  calculateGrandTotal(BillMaster: any, billItemList: any, serviceLists: any) {
    BillMaster.Quantity = 0;
    BillMaster.SubTotal = 0;
    BillMaster.DiscountAmount = 0;
    BillMaster.GSTAmount = 0;
    BillMaster.TotalAmount = 0;

    billItemList.forEach((element: any) => {
      if (element.Status !== 0) {
        BillMaster.Quantity = +BillMaster.Quantity + +element.Quantity;
        BillMaster.SubTotal = (+BillMaster.SubTotal + +element.SubTotal).toFixed(2);
        BillMaster.DiscountAmount = (+BillMaster.DiscountAmount + +element.DiscountAmount).toFixed(2);
        BillMaster.GSTAmount = (+BillMaster.GSTAmount + +element.GSTAmount).toFixed(2);
        BillMaster.TotalAmount = (+BillMaster.TotalAmount + +element.TotalAmount).toFixed(2);
        BillMaster.DueAmount = this.convertToDecimal(BillMaster.TotalAmount, 2)
      }
    });

    // serviceList
    serviceLists.forEach((element: any) => {
      if (element.Status !== 0) {
        BillMaster.SubTotal = +BillMaster.SubTotal + +element.Price;
        BillMaster.GSTAmount = +BillMaster.GSTAmount + +element.GSTAmount;
        BillMaster.TotalAmount = +BillMaster.TotalAmount + +element.TotalAmount;
      }
    });

    // RoundOff
    let TotalAmt = '';
    // TotalAmt = BillMaster.TotalAmount;
    BillMaster.RoundOff = Math.round(BillMaster.TotalAmount).toFixed(2);
    // BillMaster.RoundOff = (BillMaster.TotalAmount - Number(TotalAmt)).toFixed(2); 

  };
  // bill Master calculation start


  AddDiscalculate(fieldName: any, mode: any, BillMaster: any,) {
    // switch (mode) {

    //   case 'discount':
    //     if (fieldName === 'AddlDiscountPercentage') {
    //       if (BillMaster.AddlDiscountPercentage > 100) {
    //         Swal.fire({
    //           icon: 'warning',
    //           title: `You can't give more than 100% Discount Percentage`,
    //           text: ``,
    //           footer: '',
    //           backdrop: false,
    //         });
    //         BillMaster.AddlDiscountPercentage = 0
    //       } else {
    //         BillMaster.AddlDiscount = +BillMaster.TotalAmount * +BillMaster.AddlDiscountPercentage / 100;
    //         BillMaster.TotalAmount = BillMaster.TotalAmount - BillMaster.AddlDiscount
           
    //       }
    //     }
    //     if (fieldName === 'AddlDiscount') {
    //       if (BillMaster.AddlDiscount > BillMaster.TotalAmount) {
    //         Swal.fire({
    //           icon: 'warning',
    //           title: `You can't give discount amount more than total amount`,
    //           text: ``,
    //           footer: '',
    //           backdrop: false,
    //         });
    //         BillMaster.AddlDiscount = 0
    //       } else {
    //         BillMaster.AddlDiscountPercentage = 100 * +BillMaster.AddlDiscount / (+BillMaster.TotalAmount);
    //         BillMaster.TotalAmount = BillMaster.TotalAmount - BillMaster.AddlDiscount
          
    //       }
    //     }
    //     break;
    // }
    // BillMaster.RoundOff = Math.round(BillMaster.TotalAmount).toFixed(2);
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
