import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  decodedToken: any;
  token: any;
  constructor() {}

  setToken(token:any) {
    localStorage.setItem('token', token);
  }
  refreshToken(token:any) {
    localStorage.setItem('refreshToken', token);
  }

  getToken() {
    const token = localStorage.getItem('token');
    this.token = token;
    return token;
  }



  deleteToken() {
    localStorage.removeItem('token');
  }

  setUser(user:any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const user = JSON.parse(localStorage.getItem('user') || '' || ' ');
    return user;
  }

  decodeToken() {
    if (this.getToken()) {
      this.decodedToken = jwt_decode(this.token);
    }
  }

  getDecodeToken() {
    return jwt_decode(this.token);
  }

  getExpiryTime() {
    this.decodeToken();
    return this.decodedToken ? this.decodedToken.exp : null;
  }

  isTokenExpired(): boolean {
    const expiryTime: any = this.getExpiryTime();
    if (expiryTime) {
      return 1000 * expiryTime - new Date().getTime() < 5000;
    } else {
      return false;
    }
  }
}
