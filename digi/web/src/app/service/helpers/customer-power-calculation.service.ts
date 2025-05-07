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
  calculate(mode: any, x: any, y: any, spectacle: any, clens: any) {
    let k = 0.00;
    let a = 0.00;

    if (mode === 'Lens') {
      function validateAndHandlePLANO(spectacle:any, property:any) {
        if (spectacle[property] === 'PLANO') {
          spectacle[property] = 'PLANO';
        } else if (isNaN(Number(spectacle[property]))) {
          alert("Please fill in a valid numeric value.");
          spectacle[property] = '0.00';
        }
      }
      function CvalidateAndHandlePLANO(clens:any, property:any) {
        if (clens[property] === 'PLANO') {
          clens[property] = 'PLANO';
        } else if (isNaN(Number(clens[property]))) {
          alert("Please fill in a valid numeric value.");
          clens[property] = '0.00';
        }
      }
      
      // Validate and handle properties Spec
      validateAndHandlePLANO(spectacle, 'REDPSPH');
      validateAndHandlePLANO(spectacle, 'REDPCYL');
      validateAndHandlePLANO(spectacle, 'RENPSPH');
      validateAndHandlePLANO(spectacle, 'RENPCYL');
      validateAndHandlePLANO(spectacle, 'R_Addition');
      validateAndHandlePLANO(spectacle, 'LEDPSPH');
      validateAndHandlePLANO(spectacle, 'LEDPCYL');
      validateAndHandlePLANO(spectacle, 'LENPSPH');
      validateAndHandlePLANO(spectacle, 'LENPCYL');
      validateAndHandlePLANO(spectacle, 'L_Addition');
      // Validate and handle properties clean
      CvalidateAndHandlePLANO(clens, 'REDPSPH');
      CvalidateAndHandlePLANO(clens, 'REDPCYL');
      CvalidateAndHandlePLANO(clens, 'RENPSPH');
      CvalidateAndHandlePLANO(clens, 'RENPCYL');
      CvalidateAndHandlePLANO(clens, 'R_Addition');
      CvalidateAndHandlePLANO(clens, 'LEDPSPH');
      CvalidateAndHandlePLANO(clens, 'LEDPCYL');
      CvalidateAndHandlePLANO(clens, 'LENPSPH');
      CvalidateAndHandlePLANO(clens, 'LENPCYL');
      CvalidateAndHandlePLANO(clens, 'L_Addition');

      // right spectacle calculate start

      if (x === 'RD') {
        if (spectacle.R_Addition !== '') {

          spectacle.REDPSPH = spectacle.REDPSPH === 'PLANO' ? '+0.00' : spectacle.REDPSPH;
          spectacle.RENPSPH = spectacle.RENPSPH === 'PLANO' ? '+0.00' : spectacle.RENPSPH;

          spectacle.R_Addition = spectacle.RENPSPH - spectacle.REDPSPH

          spectacle.REDPSPH = spectacle.REDPSPH === '+0.00' ? 'PLANO' : spectacle.REDPSPH;
          spectacle.RENPSPH = spectacle.RENPSPH === '+0.00' ? 'PLANO' : spectacle.RENPSPH;

          if (spectacle.R_Addition >= 0) {
            spectacle.R_Addition = '+' + spectacle.R_Addition.toFixed(2).toString()
          } else {
            spectacle.R_Addition = spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
          }
        }
      }
      if (x === 'R') {
        if (spectacle.R_Addition !== '') {

          spectacle.REDPSPH = spectacle.REDPSPH === 'PLANO' ? '+0.00' : spectacle.REDPSPH;

          spectacle.RENPSPH = Number(spectacle.REDPSPH) + Number(spectacle.R_Addition)

          spectacle.REDPSPH = spectacle.REDPSPH === '+0.00' ? 'PLANO' : spectacle.REDPSPH;

          if (spectacle.RENPSPH >= 0) {
            spectacle.RENPSPH = '+' + spectacle.RENPSPH.toFixed(2).toString()
          } else {
            spectacle.RENPSPH = spectacle.RENPSPH.toFixed(2).toString()
          }
          spectacle.RENPCYL = spectacle.REDPCYL;
          spectacle.RENPAxis = spectacle.REDPAxis ;
        } else {
          spectacle.RENPSPH = spectacle.REDPSPH
        }
      }
      if (x === 'RN') {
        if (spectacle.RENPSPH !== '') {

          spectacle.REDPSPH = spectacle.REDPSPH === 'PLANO' ? '+0.00' : spectacle.REDPSPH;
          spectacle.RENPSPH = spectacle.RENPSPH === 'PLANO' ? '+0.00' : spectacle.RENPSPH;

          spectacle.R_Addition = spectacle.REDPSPH - spectacle.RENPSPH

          spectacle.REDPSPH = spectacle.REDPSPH === '+0.00' ? 'PLANO' : spectacle.REDPSPH;
          spectacle.RENPSPH = spectacle.RENPSPH === '+0.00' ? 'PLANO' : spectacle.RENPSPH;

          if (spectacle.R_Addition >= 0) {
            spectacle.R_Addition = '+' + spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
          } else {
            spectacle.R_Addition = spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
          }
          spectacle.RENPCYL = spectacle.REDPCYL;
          spectacle.RENPAxis = spectacle.REDPAxis;
        } else {
          spectacle.R_Addition = ''
        }
      }

      if (x === 'RNCYL') {
        spectacle.REDPCYL =  spectacle.RENPCYL ;
      }
      if (x === 'RNAxis') {
         spectacle.REDPAxis = spectacle.RENPAxis  ;
      }
   
      if (x === 'RCYL') {
        if(spectacle.RENPSPH !== '' || spectacle.R_Addition !== ''){
          spectacle.RENPCYL = spectacle.REDPCYL ;
        }
      }
      if (x === 'RAxis') {
        if(spectacle.RENPSPH !== '' || spectacle.R_Addition !== ''){
          spectacle.RENPAxis = spectacle.REDPAxis ;
        }
      }
      // right spectacle calculate end
      // left spectacle calculate start
      if (x === 'LD') {
        if (spectacle.L_Addition !== '') {
          spectacle.LEDPSPH = spectacle.LEDPSPH === 'PLANO' ? '+0.00' : spectacle.LEDPSPH;
          spectacle.LENPSPH = spectacle.LENPSPH === 'PLANO' ? '+0.00' : spectacle.LENPSPH;

          spectacle.L_Addition = spectacle.LENPSPH - spectacle.LEDPSPH;

          spectacle.LEDPSPH = spectacle.LEDPSPH === '+0.00' ? 'PLANO' : spectacle.LEDPSPH;
          spectacle.LENPSPH = spectacle.LENPSPH === '+0.00' ? 'PLANO' : spectacle.LENPSPH;

          if (spectacle.L_Addition >= 0) {
            spectacle.L_Addition = '+' + spectacle.L_Addition.toFixed(2).toString()
          } else {
            spectacle.L_Addition = spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          spectacle.LENPCYL = spectacle.LEDPCYL;
          spectacle.LENPAxis = spectacle.LEDPAxis;
        }
      }
      if (x === 'L') {
        if (spectacle.L_Addition !== '') {
          spectacle.LEDPSPH = spectacle.LEDPSPH === 'PLANO' ? '+0.00' : spectacle.LEDPSPH;

          spectacle.LENPSPH = Number(spectacle.LEDPSPH) + Number(spectacle.L_Addition);

          spectacle.LEDPSPH = spectacle.LEDPSPH === '+0.00' ? 'PLANO' : spectacle.LEDPSPH;

          if (spectacle.LENPSPH >= 0) {
            spectacle.LENPSPH = '+' + spectacle.LENPSPH.toFixed(2).toString()
          } else {
            spectacle.LENPSPH = spectacle.LENPSPH.toFixed(2).toString()
          }
          spectacle.LENPCYL = spectacle.LEDPCYL;
          spectacle.LENPAxis = spectacle.LEDPAxis;
        } else {
          spectacle.LENPSPH = spectacle.LEDPSPH
        }
      }
      if (x === 'LN') {
        if (spectacle.LENPSPH !== '') {

          spectacle.LEDPSPH = spectacle.LEDPSPH === 'PLANO' ? '+0.00' : spectacle.LEDPSPH;
          spectacle.LENPSPH = spectacle.LENPSPH === 'PLANO' ? '+0.00' : spectacle.LENPSPH;

          spectacle.L_Addition = spectacle.LEDPSPH - spectacle.LENPSPH

          spectacle.LEDPSPH = spectacle.LEDPSPH === '+0.00' ? 'PLANO' : spectacle.LEDPSPH;
          spectacle.LENPSPH = spectacle.LENPSPH === '+0.00' ? 'PLANO' : spectacle.LENPSPH;

          if (spectacle.L_Addition >= 0) {
            spectacle.L_Addition = '+' + spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
          } else {
            spectacle.L_Addition = spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          spectacle.LENPCYL = spectacle.LEDPCYL;
          spectacle.LENPAxis = spectacle.LEDPAxis; 
        } else {
          spectacle.L_Addition = ''
        }
      }

      if (x === 'LNCYL') {
        spectacle.LEDPCYL = spectacle.LENPCYL;
      }
      if (x === 'LNAxis') {
        spectacle.LEDPAxis =spectacle.LENPAxis ;
      }

      if (x === 'RDSCYL') {
        if(spectacle.LENPSPH !== '' || spectacle.L_Addition !== ''){
           spectacle.LENPCYL = spectacle.LEDPCYL;
        }
      }

      if (x === 'RDSAxis') {
        if(spectacle.LENPSPH !== '' || spectacle.L_Addition !== ''){
           spectacle.LENPAxis = spectacle.LEDPAxis;
        }
      }
      // left spectacle calculate end
    }
    else {
      // right contact calculate end
      if (x === 'CRD' && y === 0) {
        if (clens.R_Addition !== '') {
          clens.REDPSPH = clens.REDPSPH === 'PLANO' ? '+0.00' : clens.REDPSPH;
          clens.RENPSPH = clens.RENPSPH === 'PLANO' ? '+0.00' : clens.RENPSPH;

          clens.R_Addition = clens.RENPSPH - clens.REDPSPH

          clens.REDPSPH = clens.REDPSPH === '+0.00' ? 'PLANO' : clens.REDPSPH;
          clens.RENPSPH = clens.RENPSPH === '+0.00' ? 'PLANO' : clens.RENPSPH;

          if (clens.R_Addition >= 0) {
            clens.R_Addition = '+' + clens.R_Addition.toFixed(2).toString()
          } else {
            clens.R_Addition = clens.R_Addition.toFixed(2).toString().replace("-", "+")
          }
          clens.RENPCYL = clens.REDPCYL;
          clens.RENPAxis = clens.REDPAxis;
        }
      }
      if (x === 'CR' && y === 0) {
        let CR = 0.00
        if (clens.R_Addition !== '') {
          clens.REDPSPH = clens.REDPSPH === 'PLANO' ? '+0.00' : clens.REDPSPH;

          clens.RENPSPH = Number(clens.REDPSPH) + Number(clens.R_Addition)

          clens.REDPSPH = clens.REDPSPH === '+0.00' ? 'PLANO' : clens.REDPSPH;

          if (clens.RENPSPH >= 0) {
            clens.RENPSPH = '+' + clens.RENPSPH.toFixed(2).toString()
          } else {
            clens.RENPSPH = clens.RENPSPH.toFixed(2).toString()
          }
          clens.RENPCYL = clens.REDPCYL;
          clens.RENPAxis = clens.REDPAxis;
        } else {
          clens.RENPSPH = clens.REDPSPH
        }
      }
      if (x === 'CRN' && y === 0) {
        if (clens.RENPSPH !== '') {
          clens.REDPSPH = clens.REDPSPH === 'PLANO' ? '+0.00' : clens.REDPSPH;
          clens.RENPSPH = clens.RENPSPH === 'PLANO' ? '+0.00' : clens.RENPSPH;

          clens.R_Addition = clens.REDPSPH - clens.RENPSPH

          clens.REDPSPH = clens.REDPSPH === '+0.00' ? 'PLANO' : clens.REDPSPH;
          clens.RENPSPH = clens.RENPSPH === '+0.00' ? 'PLANO' : clens.RENPSPH;

          if (clens.R_Addition >= 0) {
            clens.R_Addition = '+' + clens.R_Addition.toFixed(2).toString().replace("-", "+")
          } else {
            clens.R_Addition = clens.R_Addition.toFixed(2).toString().replace("-", "+")
          }
          clens.RENPCYL = clens.REDPCYL;
          clens.RENPAxis = clens.REDPAxis;
        } else {
          clens.R_Addition = ''
        }
      }
      if (x === 'CRCYL') {
        clens.REDPCYL = clens.RENPCYL ;
      }
      if (x === 'CRAxis') {
        clens.REDPAxis =  clens.RENPAxis;
      }
      // right contact calculate end
      // left contact calculate start
      if (x === 'CLD' && y === 0) {
        if (clens.L_Addition !== '') {
          clens.LEDPSPH = clens.LEDPSPH === 'PLANO' ? '+0.00' : clens.LEDPSPH;
          clens.LENPSPH = clens.LENPSPH === 'PLANO' ? '+0.00' : clens.LENPSPH;

          clens.L_Addition = clens.LENPSPH - clens.LEDPSPH

          clens.LEDPSPH = clens.LEDPSPH === '+0.00' ? 'PLANO' : clens.LEDPSPH;
          clens.LENPSPH = clens.LENPSPH === '+0.00' ? 'PLANO' : clens.LENPSPH;

          if (clens.L_Addition >= 0) {
            clens.L_Addition = '+' + clens.L_Addition.toFixed(2).toString()
          } else {
            clens.L_Addition = clens.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          clens.LENPCYL = clens.LEDPCYL;
          clens.LENPAxis = clens.LEDPAxis;
        }

      }
      if (x === 'CL' && y === 0) {
        if (clens.L_Addition !== '') {
          clens.LEDPSPH = clens.LEDPSPH === 'PLANO' ? '+0.00' : clens.LEDPSPH;

          clens.LENPSPH = Number(clens.LEDPSPH) + Number(clens.L_Addition)

          clens.LEDPSPH = clens.LEDPSPH === '+0.00' ? 'PLANO' : clens.LEDPSPH;

          if (clens.LENPSPH >= 0) {
            clens.LENPSPH = '+' + clens.LENPSPH.toFixed(2).toString()
          } else {
            clens.LENPSPH = clens.LENPSPH.toFixed(2).toString()
          }
          clens.LENPCYL = clens.LEDPCYL;
          clens.LENPAxis = clens.LEDPAxis;
        } else {
          spectacle.LENPSPH = spectacle.LEDPSPH
        }
      }
      if (x === 'CLN' && y === 0) {
        if (clens.LENPSPH !== '') {

          clens.LEDPSPH = clens.LEDPSPH === 'PLANO' ? '+0.00' : clens.LEDPSPH;
          clens.LENPSPH = clens.LENPSPH === 'PLANO' ? '+0.00' : clens.LENPSPH;

          clens.L_Addition = clens.LEDPSPH - clens.LENPSPH

          clens.LEDPSPH = clens.LEDPSPH === '+0.00' ? 'PLANO' : clens.LEDPSPH;
          clens.LENPSPH = clens.LENPSPH === '+0.00' ? 'PLANO' : clens.LENPSPH;

          if (clens.L_Addition >= 0) {
            clens.L_Addition = '+' + clens.L_Addition.toFixed(2).toString().replace("-", "+")
          } else {
            clens.L_Addition = clens.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          clens.LENPCYL = clens.LEDPCYL;
          clens.LENPAxis = clens.LEDPAxis;
        } else {
          clens.L_Addition = ''
        }
      }

      if (x === 'CLCYL') {
       clens.LEDPCYL = clens.LENPCYL;
      }
      if (x === 'CLAxis') {
        clens.LEDPAxis =  clens.LENPAxis;
      }
      // left contact calculate end
    }
  }
  // customer power calculation end

  // customer power copy value start
  copyPower(val: any, spectacle: any, clens: any) {
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
    } else {
      spectacle.LEDPSPH = '';
      spectacle.LEDPCYL = '';
      spectacle.LEDPAxis = '';
      spectacle.LEDPVA = '';
      spectacle.L_Addition = '';
      spectacle.LENPSPH = '';
      spectacle.LENPCYL = '';
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
    } else {
      clens.LEDPSPH = '';
      clens.LEDPCYL = '';
      clens.LEDPAxis = '';
      clens.LEDPVA = '';
      clens.L_Addition = '';
      clens.LENPSPH = '';
      clens.LENPCYL = '';
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
