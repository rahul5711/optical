import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/helpers/alert.service';
import { DoctorService } from 'src/app/service/doctor.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { CustomerService } from 'src/app/service/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';


@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  @ViewChild('CusID') CusID: ElementRef | any;
  company = JSON.parse(localStorage.getItem('company') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');

  env = environment;
  gridview = true
  term = "";
  term1 = "";
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = false;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private cs: CustomerService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private route: ActivatedRoute,
    private router: Router,
        public bill: BillService,
  ) { }

  editCustomerSearch = false
  addCustomerSearch = false
  deleteCustomerSearch = false
  loginShop:any
  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'CustomerSearch') {
        this.editCustomerSearch = element.Edit;
        this.addCustomerSearch = element.Add;
        this.deleteCustomerSearch = element.Delete;
      }
    });
    this.getList();
    [this.loginShop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
  }
  
  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.cs.getList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.dataList.forEach((element: { PhotoURL: any; }) => {
            if(element.PhotoURL !== "null" && element.PhotoURL !== ''){
              element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
            }else{
              element.PhotoURL = "/assets/images/userEmpty.png"
            }
          });
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(i:any){
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show()
        const subs: Subscription = this.cs.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.success){
              this.dataList.splice(i, 1);
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  ngAfterViewInit() {
    // server-side search
    this.searching.nativeElement.focus();
    if (this.searching) {
      const nativeElem = this.searching.nativeElement
      fromEvent(nativeElem, 'keyup').pipe(
        map((event: any) => {
          return event.target.value;
        }),
        debounceTime(1000),
        distinctUntilChanged(),
      ).subscribe((text: string) => {
        //  const name = e.target.value;
        let data = {
          searchQuery: text.trim(),
        }

        if (data.searchQuery !== "") {
          const dtm = {
            currentPage: 1,
            itemsPerPage: 50000,
            searchQuery: data.searchQuery
          }
          this.sp.show()
          const subs: Subscription = this.cs.searchByFeild(dtm).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.collectionSize = 1;
                this.page = 1;
                this.dataList = res.data;
                this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide();
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        } else {
          this.sp.hide()
          this.getList()
        }
      });
    }

    if (this.CusID) {
      const nativeElem = this.CusID.nativeElement
      fromEvent(nativeElem, 'keyup').pipe(
        map((event: any) => {
          return event.target.value;
        }),
        debounceTime(1000),
        distinctUntilChanged(),
      ).subscribe((text: string) => {
        //  const name = e.target.value;
        let data = {
          searchQuery: text.trim(),
        }

        if (data.searchQuery !== "") {
          const dtm = {
            currentPage: 1,
            itemsPerPage: 50000,
            searchQuery: data.searchQuery
          }
          this.sp.show()
          const subs: Subscription = this.cs.searchByCustomerID(dtm).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.collectionSize = 1;
                this.page = 1;
                this.dataList = res.data;
                this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide();
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        } else {
          this.sp.hide()
          this.getList()
        }
      });
    }
  }


  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'customer_list');
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  sendWhatsapp(mode: any,customer:any) {
    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let WhatsappMsg = '';
    let msg = ''

   if(mode === 'Fbill') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Bill OrderReady');
        msg = `*Hi ${customer.Title} ${customer.Name},*%0A` +
        `${WhatsappMsg}%0A` +
        `*${this.loginShop.Name}* - ${this.loginShop.AreaName}%0A` +
        `${this.loginShop.MobileNo1}%0A` +
        `${this.loginShop.Website}%0A` +
        `*Please give your valuable Review for us !*`
    } 

    if(customer.MobileNo1 != ''){
      var mob = this.company.Code + customer.MobileNo1;
      var url = `https://wa.me/${mob}?text=${msg}`;
      window.open(url, "_blank");
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + customer.Name + '</b>' + ' Mobile number is not available.',
        showConfirmButton: true,
      })
    }
  }

  getWhatsAppMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName1: any; }) => element.MessageName1 === messageName);
      return foundElement ? foundElement.MessageText1 : '';
    }
    return '';
  }

      getEmailMessage(temp: any, messageName: any) {
      if (temp && temp !== 'null') {
        const foundElement = temp.find((element: { MessageName2: any; }) => element.MessageName2 === messageName);
        return foundElement ? foundElement.MessageText2 : '';
      }
      return '';
    }
  
    sendEmail(data:any) {
         if (data.Email != "" && data.Email != null && data.Email != undefined) {
        this.sp.show()
        let temp = JSON.parse(this.companySetting.EmailSetting);
        let dtm = {}
  
        let emailMsg =  this.getEmailMessage(temp, 'Customer_Bill OrderReady');
         dtm = {
          mainEmail: data.Email,
          mailSubject:  `Order ready for ${data.Name}`,
          mailTemplate: ` ${emailMsg} <br>
            <img src="https://assets-v2.lottiefiles.com/a/cb6cceb4-116b-11ee-991e-f3581f9f825e/InYycR27uh.gif" 
                       alt="Order Ready" style="max-width: 100%; height: auto;" />
                       <br>
                          <div style="padding-top: 10px;">
                            <b> ${this.loginShop.Name} (${this.loginShop.AreaName}) </b> <br>
                            <b> ${this.loginShop.MobileNo1} </b><br>
                                ${this.loginShop.Website} <br>
                                Please give your valuable Review for us !
                          </div>`,
                          ShopID : data.ShopID,
                          CompanyID : data.CompanyID
        }
      
        const subs: Subscription = this.bill.sendMail(dtm).subscribe({
          next: (res: any) => {
            if (res) {
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Mail Sent Successfully',
                  showConfirmButton: false,
                  timer: 1200
                })
            } else {
              this.as.errorToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: res.message,
                showConfirmButton: true,
                backdrop: false,
              })
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }else{
               Swal.fire({
                      position: 'center',
                      icon: 'warning',
                       title: `Email doesn't exist`, 
                      showConfirmButton: true,
                    })
             }
      }

}
