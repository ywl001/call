import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Model } from '../models/model';

@Injectable({
  providedIn: 'root'
})
export class SqlService {

  constructor(private http: HttpClient) { }

  getLbsLocation(lac, ci,mnc = 0) {
    const sql = `select * from henan where lac='${lac}' and ci = '${ci}' and mnc = '${mnc}'`;
    // console.log(sql);
    return this.http.post(Model.sqlUrl, {'sql':sql,'action':'select'})
  }

  selectBySql(sql){
    // console.log('get location:',sql);
    return this.http.post<any>(Model.sqlUrl, {'sql':sql,'action':'select'});
  }

  selectContactInfo(){
    return this.http.post<any>(Model.sqlUrl,{'sql':"select * from directory",'action':'select'});
  }

  insertOrUpdateContects(number,name){
    const sql = `insert into directory (number,name)  values('${number}','${name}') on  DUPLICATE key update name='${name}'`;
    console.log(sql);
    return this.http.post<any>(Model.sqlUrl,{'sql':sql,'action':'edit'});
  }
}
