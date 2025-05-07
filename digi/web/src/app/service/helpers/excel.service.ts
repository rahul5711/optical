import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx'


const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private http: HttpClient) { }

  public exportAsExcelFile(json: any[], excelFileName: string): void {
    const myworksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
       // Initialize column widths array
       const colWidths: number[] = [];

       // Iterate over all cells to determine maximum width for each column
       XLSX.utils.sheet_to_json(myworksheet, { header: 1 }).forEach((row: any = []) => {
         row.forEach((cell: any, index: number) => {
           const cellValue = cell ? String(cell) : '';
           colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
         });
       });
   
       // Set column widths in the worksheet
       myworksheet['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));
    const myworkbook: XLSX.WorkBook = { Sheets: { 'data': myworksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(myworkbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    const date = Date.now();
    FileSaver.saveAs(data,+  date + '_'+ fileName + '_exported'+ EXCEL_EXTENSION);
  }
}
