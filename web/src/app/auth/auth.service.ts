import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }
  IsLoggin(){
    return !!localStorage.getItem('isLoggedIn')
  }
}
