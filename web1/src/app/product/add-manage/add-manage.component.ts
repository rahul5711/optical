import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-add-manage',
  templateUrl: './add-manage.component.html',
  styleUrls: ['./add-manage.component.css']
})
export class AddManageComponent implements OnInit {
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  loggedInCompany: any = (localStorage.getItem('company'));
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  shop: any = JSON.parse(localStorage.getItem('shop') || '[]');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '[]');

  depList: any;
  showFeild = false;
  showAdd = false;
  showAddCharge = false;
  showAddService = false;
  selectedDepartment: any;
  selectedDepartmentHead: any;
  selectedProduct: any;
  dataList: any
  serviceList: any
  gstList: any
  setValueDisbled = false
  setValueServiceDisbled = false
  GstTypeDis = false

  constructor(
    private supps: SupportService,
    public as: AlertService,
    private sp: NgxSpinnerService,
  ) { }

  productType = [
    { Name: 'Fitting Type', value: 'LensType' },
    { Name: 'Reference By', value: 'ReferenceBy' },
    { Name: 'Doctor Type', value: 'DoctorType' },
    { Name: 'PaymentMode Type', value: 'PaymentModeType' },
    { Name: 'Tax Type', value: 'TaxType' },
    { Name: 'Tray No', value: 'TrayNo' },
    { Name: 'Gender', value: 'Gender' },
    { Name: 'Customer Category', value: 'CustomerCategory' },
    { Name: 'Expense Type', value: 'ExpenseType' },
    { Name: 'Location Tracker', value: 'LocationTracker' },
    { Name: 'Other', value: 'Other' },
    { Name: 'Lens Type', value: 'LensType' },
    { Name: 'Axis', value: 'Axis' },
    { Name: 'Addition', value: 'Addition' },

  ]

  data1: any = { ID: null, CompanyID: null, Name: '', Category: null, Status: 1, CreatedBy: null, UpdatedBy: null, };
  newDepartment: any = { ID: null, CompanyID: null, Name: "", TableName: null, Status: 1 };

  selectedRow: any = { ID: null, CompanyID: null, Name: null, Description: null, Cost: 0, Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "", TotalAmount: 0 };
  Service: any = { ID: null, CompanyID: null, Name: null, Description: null, Cost: 0, Price: 0, SubTotal: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: " ", TotalAmount: 0 };


  editAddManagement = false
  addAddManagement = false
  deleteAddManagement = false

  editChargeManagement = false
  addChargeManagement = false
  deleteChargeManagement = false

  editServiceManagement = false
  addServiceManagement = false
  deleteServiceManagement = false
  loginShop: any;
  ngOnInit(): void {
    [this.loginShop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'AddManagement') {
        this.editAddManagement = element.Edit;
        this.addAddManagement = element.Add;
        this.deleteAddManagement = element.Delete;
      } else if (element.ModuleName === 'ChargeManagement') {
        this.editChargeManagement = element.Edit;
        this.addChargeManagement = element.Add;
        this.deleteChargeManagement = element.Delete;
      } else if (element.ModuleName === 'ServiceManagement') {
        this.editServiceManagement = element.Edit;
        this.addServiceManagement = element.Add;
        this.deleteServiceManagement = element.Delete;
      }
    });
    this.chargelist();
    this.servicelist();
    this.getList();
  }

  getfieldList() {
    this.sp.show()
    if (this.selectedProduct !== null || this.selectedProduct !== '') {
      this.showFeild = true;
      const subs: Subscription = this.supps.getList(this.selectedProduct).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.showAdd = false
            this.depList = res.data;
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  showData() {
    this.depList.forEach((element: { Name: any; DepartmentHead: any; ID: any; }) => {
      if (element.Name === this.selectedDepartment) { this.selectedDepartmentHead = element.DepartmentHead; this.selectedDepartment = element.ID; }
    });
  }

  saveDepartment() {
    this.sp.show()
    let count = 0;
    this.depList.forEach((element: { Name: string; }) => {
      if ((element.Name.toLowerCase()).trim() === (this.newDepartment.Name.toLowerCase()).trim()) { count = count + 1; }
    });

    if (count === 0 && this.newDepartment.Name !== '') {
      this.newDepartment.TableName = this.selectedProduct;
      const subs: Subscription = this.supps.saveData(this.newDepartment.TableName, this.newDepartment.Name.trim()).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.newDepartment.Name = ''
            this.getfieldList();
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been save.',
              showConfirmButton: false,
              timer: 1200
            })
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });

    } else {
      this.sp.hide()
      Swal.fire({
        icon: 'error',
        title: 'Duplicate or Empty values are not allowed',
        text: '',
        footer: ''
      });
    }
  }

  delSupport() {
    if (this.data1.Category === null || this.data1.Category === '') {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Please Select Value.',
        showConfirmButton: true,
        timer: 2000
      })
    } else {
      this.depList.forEach((element: { Name: any; ID: any; }) => {
        if (element.Name === this.data1.Category) {
          this.sp.show()
          const subs: Subscription = this.supps.deleteSupport(this.selectedProduct, element.Name).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.getfieldList();
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Your file has been deleted.',
                  showConfirmButton: false,
                  timer: 1200
                })
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide()
            },
            error: (err: any) => {
              console.log(err.msg);
            },
            complete: () => subs.unsubscribe(),
          });

        }
      });
    }
  }

  setValues() {
    this.setValueDisbled = true
    this.dataList.forEach((element: { ID: any; Name: any; Price: any; Description: any; GSTAmount: any; GSTPercentage: any; GSTType: any; TotalAmount: any; }) => {
      if (element.Name === this.selectedRow.Name) {
        this.selectedRow.Price = element.Price;
        this.selectedRow.Description = element.Description;
        this.selectedRow.GSTAmount = element.GSTAmount;
        this.selectedRow.GSTPercentage = element.GSTPercentage;
        this.selectedRow.GSTType = element.GSTType;
        this.selectedRow.TotalAmount = element.TotalAmount;
      }
    });
  }

  calculate(fieldName: string, mode: any) {
    switch (mode) {
      case 'chgst':
        if (fieldName === 'GSTPercentage') {
          if (this.selectedRow.GSTPercentage === null || this.selectedRow.GSTPercentage === '' || (Number(this.selectedRow.GSTPercentage) > 100)) {
            Swal.fire({
              icon: 'warning',
              title: `You can't give more than 100% GSTPercentage`,
              text: ``,
              footer: '',
              backdrop: false,
            });
            this.selectedRow.GSTPercentage = 0;
            this.selectedRow.GSTType = 'None'
          } else {
            this.selectedRow.GSTAmount = +this.selectedRow.Price * +this.selectedRow.GSTPercentage / 100;
          }
        }

        if (fieldName === 'GSTAmount') {
          if (this.selectedRow.GSTAmount === null || this.selectedRow.GSTAmount === '') {
            this.selectedRow.GSTAmount = 0;
          } else {
            this.selectedRow.GSTPercentage = 100 * +this.selectedRow.GSTAmount / (+this.selectedRow.Price);
          }
        }

        break;
      case 'chtotal':
        this.selectedRow.TotalAmount = +this.selectedRow.GSTAmount + +this.selectedRow.Price;
        break;
    }

  }

  resetData() {
    this.setValueDisbled = false
    this.selectedRow = { ID: null, CompanyID: null, Name: null, Description: null, Cost: 0, Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None", TotalAmount: 0 };
  }

  chargesave() {

    if ((this.selectedRow.GSTType === 'None' && this.selectedRow.GSTPercentage !== 0) || (this.selectedRow.GSTPercentage === 0 && this.selectedRow.GSTType !== 'None') || (this.selectedRow.GSTPercentage === null && this.selectedRow.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      this.showAddCharge = true
    } else {
      this.sp.show()
      const subs: Subscription = this.supps.chargesave(this.selectedRow).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.resetData();
            this.chargelist();
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Duplicate or Empty Values are not allowed',
              text: '',
              footer: ''
            });
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    }

  }

  chargedelete(i: string | number) {
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
        this.sp.show();
        const subs: Subscription = this.supps.chargedelete(this.dataList[i].Name).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.dataList.splice(i, 1);
              this.as.successToast(res.message)
              this.selectedRow = { ID: null, CompanyID: null, Name: null, Description: null, Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "" };
              this.chargelist();
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  chargelist() {
    this.sp.show();
    const subs: Subscription = this.supps.chargelist(this.selectedRow).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dataList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gstList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  setValuesService() {
    this.setValueServiceDisbled = true
    this.serviceList.forEach((element: { ID: any; Name: any; Cost: any, Price: any; Description: any; SubTotal: any, GSTAmount: any; GSTPercentage: any; GSTType: any; TotalAmount: any; }) => {
      if (element.Name === this.Service.Name) {
        this.Service.Cost = element.Cost;
        this.Service.Price = element.Price;
        this.Service.Description = element.Description;
        this.Service.SubTotal = element.SubTotal;
        this.Service.GSTAmount = element.GSTAmount;
        this.Service.GSTPercentage = element.GSTPercentage;
        this.Service.GSTType = element.GSTType;
        this.Service.TotalAmount = element.TotalAmount;
      }
    });
  }

  calculateSevice(fieldName: string, mode: any) {
    switch (mode) {
      case 'subTotal':
        this.Service.SubTotal = +this.Service.Price;
        break;

      case 'chgst1':
        if (this.loginShop.WholesaleBill == 'true') {
          if (fieldName === 'GSTPercentage') {
            if (this.Service.GSTPercentage === null || this.Service.GSTPercentage === '' || (Number(this.Service.GSTPercentage) > 100)) {
              Swal.fire({
                icon: 'warning',
                title: `You can't give more than 100% GSTPercentage`,
                text: ``,
                footer: '',
                backdrop: false,
              });
              this.Service.GSTPercentage = 0;

            } else {
              this.Service.GSTAmount = +this.Service.Price * +this.Service.GSTPercentage / 100;
            }
          }
          if (fieldName === 'GSTAmount') {
            if (this.Service.GSTAmount === null || this.Service.GSTAmount === '') {
              this.Service.GSTAmount = 0;
            } else {
              this.Service.GSTPercentage = 100 * +this.Service.GSTAmount / (+this.Service.Price);
            }
          }
        }

        if (this.loginShop.RetailBill == 'true') {
          if (fieldName === 'GSTPercentage') {
            if (this.Service.GSTPercentage === null || this.Service.GSTPercentage === '' || (Number(this.Service.GSTPercentage) > 100)) {
              Swal.fire({
                icon: 'warning',
                title: `You can't give more than 100% GSTPercentage`,
                text: ``,
                footer: '',
                backdrop: false,
              });
              this.Service.GSTPercentage = 0;

            } else {
              this.Service.GSTAmount = +this.Service.Price * +this.Service.GSTPercentage / 100;
            }
          }
          if (fieldName === 'GSTAmount') {
            if (this.Service.GSTAmount === null || this.Service.GSTAmount === '') {
              this.Service.GSTAmount = 0;
            } else {
              this.Service.GSTPercentage = 100 * +this.Service.GSTAmount / (+this.Service.Price);
            }
          }
        }


        break;
      case 'chtotal1':
        this.Service.TotalAmount = +this.Service.Price;
        this.Service.SubTotal =  this.Service.TotalAmount - +this.Service.GSTAmount ;
        break;
    }

  }

  serviceresetData() {
    this.setValueServiceDisbled = false
    this.Service = { ID: null, CompanyID: null, Name: null, Description: null, Cost: 0, Price: 0, SubTotal: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None", TotalAmount: 0 };
  }

  servicesave() {

    if ((this.Service.GSTType === 'None' && this.Service.GSTPercentage !== 0) || (this.Service.GSTPercentage === 0 && this.Service.GSTType !== 'None') || (this.Service.GSTPercentage == null && this.Service.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      this.showAddService = true
    } else {
      this.sp.show();
      const subs: Subscription = this.supps.servicesave(this.Service).subscribe({
        next: (res: any) => {
          // this.serviceList = res.result;
          if (res.success) {
            this.serviceresetData();
            this.servicelist();
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Duplicate or Empty Values are not allowed',
              text: '',
              footer: ''
            });
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    }
  }

  servicedelete(i: string | number) {
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
        this.sp.show();
        const subs: Subscription = this.supps.servicedelete(this.serviceList[i].Name).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.serviceList.splice(i, 1);
              this.as.successToast(res.message)
              this.Service = { ID: null, CompanyID: null, Name: null, Description: null, Cost: 0, Price: 0, SubTotal: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "" };
              this.servicelist();
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  servicelist() {
    this.sp.show()
    const subs: Subscription = this.supps.servicelist(this.Service).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.serviceList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
