import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent implements OnInit {
  userImage :any;
  
  constructor() { }

  data1= { ID : null, CompanyID : null , Name : null, UserGroup : "Employee", DOB : null, Anniversary : null, MobileNo1 : null,
  MobileNo2 : null, PhoneNo : null, Email : null, Address : null, Branch : '', FaxNo : null, Website : null, PhotoURL : null, Document: null,
  LoginName : "", Password : "", Status : 1, CreatedBy : null, UpdatedBy : null, CreatedOn : "", UpdatedOn : null, CommissionType: 0, CommissionMode: 0,
  CommissionValue: 0, CommissionValueNB: 0
  };

  userShop: any = {ID: null, UserID: null, ShopID: null, RoleID: null, Status: 1, CreatedOn: null, CreatedBy: null};

  ngOnInit(): void {
  }
  onSubmit(){
    
  }
}
