

import { Injectable, ErrorHandler } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';

// in bytes, compress images larger than 1MB
const fileSizeMax = 1 * 500 * 500;
// in pixels, compress images have the width or height larger than 1024px
const widthHeightMax = 500;
const defaultWidthHeightRatio = 1;
const defaultQualityRatio = 100;

@Injectable({
  providedIn: 'root'
})
export class CompressImageService {
  env = environment;
  private baseUrl = this.env.apiUrl + 'upload';
  constructor(private http: HttpClient) { }


  compress(file: File): Observable<File> {
    const imageType = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.readAsDataURL(file);

    return Observable.create((observer:   any) => {
      // This event is triggered each time the reading operation is successfully completed.
      reader.onload = (ev) => {
        // Create an html image element
        const img = this.createImage(ev);
        // Choose the side (width or height) that longer than the other
        const imgWH = img.width > img.height ? img.width : img.height;

        // Determines the ratios to compress the image
        let withHeightRatio =
          imgWH > widthHeightMax
            ? widthHeightMax / imgWH
            : defaultWidthHeightRatio;
        let qualityRatio =
          file.size > fileSizeMax
            ? fileSizeMax / file.size
            : defaultQualityRatio;

        // Fires immediately after the browser loads the object
        img.onload = () => {
          const elem = document.createElement('canvas');
          // resize width, height
          elem.width = img.width * withHeightRatio;
          elem.height = img.height * withHeightRatio;

          const ctx = <CanvasRenderingContext2D>elem.getContext('2d');
          ctx.drawImage(img, 0, 0, elem.width, elem.height);
          ctx.canvas.toBlob(
            // callback, called when blob created
            (blob:any) => {
              observer.next(
                new File([blob], file.name, {
                  type: imageType,
                  lastModified: Date.now(),
                })
              );
            },
            imageType,
            qualityRatio // reduce image quantity
          );
        };
      };

      // Catch errors when reading file
      reader.onerror = (error) => observer.error(error);
    });
  }

  private createImage(ev: any) {
    let imageContent = ev.target.result;
    const img:any = new Image();
    img.src = imageContent;
    return img;
  }


}

