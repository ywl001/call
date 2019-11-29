import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as  XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor() { }

  importFromExcel(ev): Observable<any> {
    let workbook;
    let excelInJSON;

    const fileReader = new FileReader();

    fileReader.readAsBinaryString((<any>ev.target).files[0]);

    return Observable.create(observer => {
      // if success
      fileReader.onload = (event: any) => {
        const binary: string = event.target.result;
        workbook = XLSX.read(binary, { type: 'binary' });
        const wsname: string = workbook.SheetNames[0];
        const ws: XLSX.WorkSheet = workbook.Sheets[wsname];
        // only first sheet
        excelInJSON = XLSX.utils.sheet_to_json(ws, { raw: false, defval: null, blankrows: false });

        observer.next(excelInJSON);
      };

      // if failed
      fileReader.onerror = error => observer.error(error);
    });
  }
}
