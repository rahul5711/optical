import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomerPowerCalculationService {

  constructor(private httpClient: HttpClient) { }

   // customer power calculation start
   calculate(mode:any, x:any, y:any, spectacle:any, clens:any){
    let k = 0.00;
    let a = 0.00;
  
    if (mode === 'Lens'){
      if(isNaN(Number(spectacle.R_Addition)) === true) {
        alert("please fill up Number value");
        spectacle.R_Addition = 0.00;
      }
      if(isNaN(Number(spectacle.REDPCYL)) === true) {
        alert("please fill up Number value");
        spectacle.REDPCYL = 0.00;
      }
      if(spectacle.RENPSPH === 'PLANO') {
        spectacle.RENPSPH = '+0.00';
      }
      if(isNaN(Number(spectacle.RENPSPH)) === true) {
        alert("please fill up Number value");
        spectacle.RENPSPH = 0.00;
      }
      if(spectacle.REDPSPH === 'PLANO') {
        spectacle.REDPSPH = '+0.00';
      }
      if(isNaN(Number(spectacle.REDPSPH)) === true && spectacle.REDPSPH !== 'PLANO') {
        alert("please fill up Number value");
        spectacle.REDPSPH = 0.00;
      }
   
      if(isNaN(Number(spectacle.L_Addition)) === true) {
        alert("please fill up Number value");
        spectacle.L_Addition = 0.00;
      }
      if(spectacle.LENPSPH === 'PLANO') {
        spectacle.LENPSPH = '+0.00';
      }
      if(isNaN(Number(spectacle.LENPSPH )) === true) {
        alert("please fill up Number value");
        spectacle.LENPSPH  = 0.00;
      }
      if(spectacle.LEDPSPH === 'PLANO') {
        spectacle.LEDPSPH = '+0.00';
      }
      if(isNaN(Number(spectacle.LEDPSPH )) === true) {
        alert("please fill up Number value");
        spectacle.LEDPSPH  = 0.00;
      }

      // right spectacle calculate start
      if (x === 'RD')
      { if(spectacle.R_Addition !== ''){
        spectacle.R_Addition  = Number(spectacle.RENPSPH)  - Number(spectacle.REDPSPH)
        if(spectacle.R_Addition >= 0){
          spectacle.R_Addition = '+' + spectacle.R_Addition.toFixed(2).toString()
        }else{
          spectacle.R_Addition =  spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
        }
        spectacle.RENPCYL = spectacle.REDPCYL;
        spectacle.RENPAxis = spectacle.REDPAxis;
      }
       
      } 
      if (x === 'R' ){
        if (spectacle.R_Addition !== ''){
          spectacle.RENPSPH = Number(spectacle.REDPSPH) + Number(spectacle.R_Addition)
          if(spectacle.RENPSPH >= 0){
            spectacle.RENPSPH = '+' + spectacle.RENPSPH.toFixed(2).toString()
          }else{
            spectacle.RENPSPH =  spectacle.RENPSPH.toFixed(2).toString()
          }
           spectacle.RENPCYL = spectacle.REDPCYL;
           spectacle.RENPAxis = spectacle.REDPAxis; 
        }else{
          spectacle.RENPSPH = spectacle.REDPSPH
        }
      }
      if (x === 'RN' ){
        if (spectacle.RENPSPH !== '' ){
          spectacle.R_Addition  =  Number(spectacle.REDPSPH) -  Number(spectacle.RENPSPH) 
          if(spectacle.R_Addition >= 0){
            spectacle.R_Addition = '+' + spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
          }else{
            spectacle.R_Addition =   spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
          }
          spectacle.RENPCYL = spectacle.REDPCYL;
          spectacle.RENPAxis = spectacle.REDPAxis; 
        } else{
          spectacle.R_Addition = ''
        }
      }
      // right spectacle calculate end
      // left spectacle calculate start
      if (x === 'LD')
      { if(spectacle.L_Addition !== ''){
        spectacle.L_Addition  = Number(spectacle.LENPSPH)  - Number(spectacle.LEDPSPH)
        if(spectacle.L_Addition >= 0){
          spectacle.L_Addition = '+' + spectacle.L_Addition.toFixed(2).toString()
        }else{
          spectacle.L_Addition =  spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
        }
        spectacle.LENPCYL = spectacle.LEDPCYL;
        spectacle.LENPAxis = spectacle.LEDPAxis;
      }
       
      } 
      if (x === 'L' ){
        if (spectacle.L_Addition !== ''){
          spectacle.LENPSPH = Number(spectacle.LEDPSPH) + Number(spectacle.L_Addition)
          if(spectacle.LENPSPH >= 0){
            spectacle.LENPSPH = '+' + spectacle.LENPSPH.toFixed(2).toString()
          }else{
            spectacle.LENPSPH =  spectacle.LENPSPH.toFixed(2).toString()
          }
           spectacle.LENPCYL = spectacle.LEDPCYL;
           spectacle.LENPAxis = spectacle.LEDPAxis; 
        }else{
          spectacle.LENPSPH = spectacle.LEDPSPH
        }
       }
      if (x === 'LN'){
       if (spectacle.LENPSPH !== '' ){
          spectacle.L_Addition  =  Number(spectacle.LEDPSPH) -  Number(spectacle.LENPSPH) 
          if(spectacle.L_Addition >= 0){
            spectacle.L_Addition = '+' + spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
          }else{
            spectacle.L_Addition =   spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          spectacle.LENPCYL = spectacle.LEDPCYL;
          spectacle.LENPAxis = spectacle.LEDPAxis; 
        } else{
          spectacle.L_Addition = ''
        }
      }
      // left spectacle calculate end

    }
    else{
      // right contact calculate end
      if (x === 'CRD' && y === 0)
        { if(clens.R_Addition !== ''){
        clens.R_Addition  = Number(clens.RENPSPH)  - Number(clens.REDPSPH)
        if(clens.R_Addition >= 0){
          clens.R_Addition = '+' + clens.R_Addition.toFixed(2).toString()
        }else{
          clens.R_Addition =  clens.R_Addition.toFixed(2).toString().replace("-", "+")
        }
        clens.RENPCYL = clens.REDPCYL;
        clens.RENPAxis = clens.REDPAxis;
        }
      } 
      if (x === 'CR' && y === 0){
      let CR = 0.00
         if (clens.R_Addition !== ''){
        clens.RENPSPH = Number(clens.REDPSPH) + Number(clens.R_Addition)
        if(clens.RENPSPH >= 0){
          clens.RENPSPH = '+' + clens.RENPSPH.toFixed(2).toString()
        }else{
          clens.RENPSPH =  clens.RENPSPH.toFixed(2).toString()
        }
        clens.RENPCYL = clens.REDPCYL;
        clens.RENPAxis = clens.REDPAxis; 
         }else{
          clens.RENPSPH = clens.REDPSPH
         }
      }
      if (x === 'CRN' && y === 0){
        if (clens.RENPSPH !== '' ){
        clens.R_Addition  =  Number(clens.REDPSPH) -  Number(clens.RENPSPH) 
        if(clens.R_Addition >= 0){
          clens.R_Addition = '+' + clens.R_Addition.toFixed(2).toString().replace("-", "+")
        }else{
          clens.R_Addition =   clens.R_Addition.toFixed(2).toString().replace("-", "+")
        }
        clens.RENPCYL = clens.REDPCYL;
        clens.RENPAxis = clens.REDPAxis; 
        } else{
        clens.R_Addition = ''
        } 
      }
      // right contact calculate end
      // left contact calculate start
      if (x === 'CLD' && y === 0)
      { if(clens.L_Addition !== ''){
        clens.L_Addition  = Number(clens.LENPSPH)  - Number(clens.LEDPSPH)
        if(clens.L_Addition >= 0){
          clens.L_Addition = '+' + clens.L_Addition.toFixed(2).toString()
        }else{
          clens.L_Addition =  clens.L_Addition.toFixed(2).toString().replace("-", "+")
        }
        clens.LENPCYL = clens.LEDPCYL;
        clens.LENPAxis = clens.LEDPAxis;
      }
       
      } 
      if (x === 'CL' && y === 0){
        if (clens.L_Addition !== ''){
          clens.LENPSPH = Number(clens.LEDPSPH) + Number(clens.L_Addition)
          if(clens.LENPSPH >= 0){
            clens.LENPSPH = '+' + clens.LENPSPH.toFixed(2).toString()
          }else{
            clens.LENPSPH =  clens.LENPSPH.toFixed(2).toString()
          }
           clens.LENPCYL = clens.LEDPCYL;
           clens.LENPAxis = clens.LEDPAxis; 
        }else{
          spectacle.LENPSPH = spectacle.LEDPSPH
        }
       }
      if (x === 'CLN' && y === 0){
       if (clens.LENPSPH !== '' ){
          clens.L_Addition  =  Number(clens.LEDPSPH) -  Number(clens.LENPSPH) 
          if(clens.L_Addition >= 0){
            clens.L_Addition = '+' + clens.L_Addition.toFixed(2).toString().replace("-", "+")
          }else{
            clens.L_Addition =   clens.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          clens.LENPCYL = clens.LEDPCYL;
          clens.LENPAxis = clens.LEDPAxis; 
        } else{
          clens.L_Addition = ''
        }
      }
      // left contact calculate end
    }  
  }
  // customer power calculation end

  // customer power copy value start
  copyPower(val: any,spectacle:any, clens:any){
    if (val) {
      spectacle.LEDPSPH = spectacle.REDPSPH;
      spectacle.LEDPCYL = spectacle.REDPCYL;
      spectacle.LEDPAxis = spectacle.REDPAxis;
      spectacle.LEDPVA = spectacle.REDPVA;
      spectacle.L_Addition = spectacle.R_Addition;
      spectacle.LENPSPH = spectacle.RENPSPH;
      spectacle.LENPCYL = spectacle.RENPCYL;
      spectacle.LENPAxis = spectacle.RENPAxis;
      spectacle.LENPVA = spectacle.RENPVA;
    }else{
      spectacle.LEDPSPH = '';
      spectacle.LEDPCYL = '';
      spectacle.LEDPAxis = '';
      spectacle.LEDPVA = '';
      spectacle.L_Addition = '';
      spectacle.LENPSPH = '';
      spectacle.LENPCYL ='';
      spectacle.LENPAxis = '';
      spectacle.LENPVA = '';
    }
    if (val) {
      clens.LEDPSPH = clens.REDPSPH;
      clens.LEDPCYL = clens.REDPCYL;
      clens.LEDPAxis = clens.REDPAxis;
      clens.LEDPVA = clens.REDPVA;
      clens.L_Addition = clens.R_Addition;
      clens.LENPSPH = clens.RENPSPH;
      clens.LENPCYL = clens.RENPCYL;
      clens.LENPAxis = clens.RENPAxis;
      clens.LENPVA = clens.RENPVA;
    }else{
      clens.LEDPSPH = '';
      clens.LEDPCYL = '';
      clens.LEDPAxis = '';
      clens.LEDPVA = '';
      clens.L_Addition = '';
      clens.LENPSPH = '';
      clens.LENPCYL ='';
      clens.LENPAxis = '';
      clens.LENPVA = '';
    }
  }
  // customer power copy value start


  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }
}
