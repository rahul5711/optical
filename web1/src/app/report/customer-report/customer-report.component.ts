import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';
import { CustomerService } from 'src/app/service/customer.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';


@Component({
  selector: 'app-customer-report',
  templateUrl: './customer-report.component.html',
  styleUrls: ['./customer-report.component.css']
})
export class CustomerReportComponent implements OnInit {

  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: CustomerService,
    private supps: SupportService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private modalService: NgbModal,
    private excelService: ExcelService,
  ) { }

  dataList: any = [];
  powerList: any = [];
  Type = 'Customer'

  ngOnInit(): void {
    this.exportCustomerData();
    // this.exportCustomerPower();
  }


  exportCustomerData() {
    this.sp.show()
    const subs: Subscription = this.sup.exportCustomerData('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  exportCustomerPower() {
    this.sp.show()
    if (this.Type === 'Customer') {
      const subs: Subscription = this.sup.exportCustomerData('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
            this.powerList = res.data
            this.excel(this.Type)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      const subs: Subscription = this.sup.exportCustomerPower(this.Type).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
            this.powerList = res.data
            this.excel(this.Type)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }


  excel(Type: any): void {
    
    let data = []
    if (Type === 'Customer') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          MRDNO: e.MRDNO,
          Cust_ID: e.Sno,
          Name: e.Name,
          MobileNo1: e.MobileNo1,
          MobileNo2: e.MobileNo2,
          Age: e.Age,
          Gender: e.Gender,
          Address: e.Address,
          Remarks: e.Remarks,
          Category: e.Category,
          Anniversary: e.Anniversary,
          DOB: e.DOB,
          Email: e.Email,
          PhoneNo: e.PhoneNo,
          RefferedByDoc: e.RefferedByDoc,
          ReferenceType: e.ReferenceType,
          GSTNo: e.GSTNo,
          Other: e.Other,
          ShopName: e.ShopName,
          ShopID: e.ShopID,
        }
      })
    } else if (Type === 'spectacle_rx') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          VisitNo: e.VisitNo,
          Cust_ID: e.Sno,
          CustomerName: e.CustomerName,
          REDPSPH: e.REDPSPH,
          REDPCYL: e.REDPCYL,
          REDPAxis: e.REDPAxis,
          REDPVA: e.REDPVA,
          LEDPSPH: e.LEDPSPH,
          LEDPCYL: e.LEDPCYL,
          LEDPAxis: e.LEDPAxis,
          LEDPVA: e.LEDPVA,
          RENPSPH: e.RENPSPH,
          RENPCYL: e.RENPCYL,
          RENPAxis: e.RENPAxis,
          RENPVA: e.RENPVA,
          LENPSPH: e.LENPSPH,
          LENPCYL: e.LENPCYL,
          LENPAxis: e.LENPAxis,
          LENPVA: e.LENPVA,
          REPD: e.REPD,
          LEPD: e.LEPD,
          R_Addition: e.R_Addition,
          L_Addition: e.L_Addition,
          R_Prism: e.R_Prism,
          L_Prism: e.L_Prism,
          Lens: e.Lens,
          Shade: e.Shade,
          Frame: e.Frame,
          VertexDistance: e.VertexDistance,
          RefractiveInde: e.RefractiveIndex,
          FittingHeight: e.FittingHeight,
          ConstantUse: e.ConstantUse,
          NearWork: e.NearWork,
          DistanceWork: e.DistanceWork,
          RefferedByDoc: e.RefferedByDoc,
          Reminder: e.Reminder,
          ExpiryDate: e.ExpiryDate,
        }
      })
    } else if (Type === 'contact_lens_rx') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          VisitNo: e.VisitNo,
          Cust_ID: e.Sno,
          CustomerName: e.CustomerName,
          REDPSPH: e.REDPSPH,
          REDPCYL: e.REDPCYL,
          REDPAxis: e.REDPAxis,
          REDPVA: e.REDPVA,
          LEDPSPH: e.LEDPSPH,
          LEDPCYL: e.LEDPCYL,
          LEDPAxis: e.LEDPAxis,
          LEDPVA: e.LEDPVA,
          RENPSPH: e.RENPSPH,
          RENPCYL: e.RENPCYL,
          RENPAxis: e.RENPAxis,
          RENPVA: e.RENPVA,
          LENPSPH: e.LENPSPH,
          LENPCYL: e.LENPCYL,
          LENPAxis: e.LENPAxis,
          LENPVA: e.LENPVA,
          REPD: e.REPD,
          LEPD: e.LEPD,
          R_Addition: e.R_Addition,
          L_Addition: e.L_Addition,
          R_KR: e.R_KR,
          L_KR: e.L_KR,
          R_HVID: e.R_HVID,
          L_HVID: e.L_HVID,
          R_CS: e.R_CS,
          L_CS: e.L_CS,
          R_BC: e.R_BC,
          L_BC: e.L_BC,
          R_Diameter: e.R_Diameter,
          L_Diameter: e.L_Diameter,
          BR: e.BR,
          Material: e.Material,
          Modality: e.Modality,
          Other: e.Other,
          ConstantUse: e.ConstantUse,
          NearWork: e.NearWork,
          DistanceWork: e.DistanceWork,
          Multifocal: e.Multifocal,
          RefferedByDoc: e.RefferedByDoc,
          ExpiryDate: e.ExpiryDate,
        }
      })
    } else if (Type === 'other_rx') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          VisitNo: e.VisitNo,
          Cust_ID: e.Sno,
          CustomerName: e.CustomerName,
          BP: e.BP,
          Sugar: e.Sugar,
          IOL_Power: e.IOL_Power,
          Operation: e.Operation,
          R_VN: e.R_VN,
          L_VN: e.L_VN,
          R_TN: e.R_TN,
          L_TN: e.L_TN,
          R_KR: e.R_KR,
          L_KR: e.L_KR,
          Treatment: e.Treatment,
          Diagnosis: e.Diagnosis,
          RefferedByDoc: e.RefferedByDoc,
        }
      })
    }

    this.excelService.exportAsExcelFile(data, this.Type);
  }

}
