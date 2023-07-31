import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService , private router : Router){

  }
  canActivate(){
    if (this.auth.IsLoggin()){
      return true;
    }
    alert("Here Way will not work, please login correctly Way.")
    this.router.navigate(['login']);
    return false;
  }

  
}
