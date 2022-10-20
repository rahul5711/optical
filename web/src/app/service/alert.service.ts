import { Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: "root",
})
export class AlertService {


  constructor(private toastr: ToastrService,private http: HttpClient) {}

  toastOptions = {
    timeOut: 1500,
    positionClass: "toast-bottom-right",
    preventDuplicates: true,
  };

  successToast(msg: any) {
    this.toastr.success(msg, "Success", this.toastOptions);
  }
  errorToast(msg: any) {
    this.toastr.error(msg, "Error", this.toastOptions);
  }
  warningToast(msg: any) {
    this.toastr.warning(msg, "Warning", this.toastOptions);
  }
  infoToast(msg: any) {
    this.toastr.info(msg, "Info", this.toastOptions);
  }


  back() {
    history.back();
}





}
