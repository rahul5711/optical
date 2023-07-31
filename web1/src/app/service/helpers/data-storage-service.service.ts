import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataStorageServiceService {
  permission: any;
  user: any ;
  constructor() {
    this.permission =  JSON.parse(localStorage.getItem('permission') || '[]');    
    this.user = JSON.parse(localStorage.getItem('user') || '{}')     
   }


  // checkPermission(ModuleName: any, type: any) { 
  //   if (this.user.UserGroup !== 'CompanyAdmin') {
  //     this.permission.filter((x:any)=> {
  //       if (x.ModuleName === ModuleName) {
  //         return x[`${type}`] ? x[`${type}`] : false  
  //       }
  //     }) 
  //   } 
  //   return true
  // }

  checkPermission(ModuleName: any, type: any) { 
   if (this.user.UserGroup !== 'CompanyAdmin') {
    const modulePermission = this.permission.find((x: { ModuleName: any; }) => x.ModuleName === ModuleName);
    if (modulePermission) {
      return modulePermission[type] ? true : false;
    }
    // If the module is not found in the permissions array, return false
    return false;
  }
  // If the user is a 'CompanyAdmin', return true to allow access.
  return true;
  }



  goBack() {
    window.history.back()
  }
}
