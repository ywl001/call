import { Injectable } from '@angular/core';
import { Model } from '../models/model';
import { Record } from '../models/record';

declare var WebSQL;

@Injectable({
  providedIn: 'root'
})

export class DbService {

  private db;
  public static CURRENT_TABLE: string;
  constructor() {
    this.db = WebSQL("mydb");
  }

  createTable(tableName: string) {
    let fields = [Model.OTHER_NUMBER,Model.START_TIME,Model.DURATION,Model.CALL_TYPE,Model.MNC,Model.LAC,Model.CI,Model.LAT,Model.LNG,Model.ACC,Model.ADDR]
    let sql = `create table \`${tableName}\` (id integer PRIMARY key AUTOINCREMENT,`;
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      sql += '\"' + field + '\",';
    }
    sql = sql.substr(0, sql.length - 1);
    sql += ")";
    // console.log(sql);
    return this.db.query(sql);
  }
  /**
   * 插入表记录，数据格式：第一条为表字段，其余为内容[[field1,field2],[aaa,bbb]]
   * @param tableName 
   * @param tableData 
   */
  insertData(tableName: string, tableData: any) {
    let fields: any[] = tableData[0];
    //拼凑插入字符串
    let sql = "insert into `" + tableName + "` (";
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      sql += '\"' + field + '\",';
    }
    sql = sql.substr(0, sql.length - 1);
    sql += ") values(";

    for (let i = 0; i < fields.length; i++) {
      sql += "?,";
    }

    sql = sql.substr(0, sql.length - 1);
    sql += ")";

    console.log(sql);

    tableData.shift();
    return this.db.query(sql, tableData);

  }

  /**
   * 添加基站的经纬度
   * @param tableName 表名
   * @param lac 基站号
   * @param ci 小区号
   * @param lat 纬度
   * @param lng 经度
   * @param callback 回调
   */
  updateLatLng(tableName: string, lac,ci,lat,lng,callback, fail = null){
    const sql = `update ${tableName} set lat = '${lat}',lng = '${lng}' where lac = '${lac}' and ci='${ci}'`;
    console.log(sql)
    this.db.rawTx(tx => {
      tx.executeSql(sql, [], callback, fail);
    })
  }
  /**
   * 获取所有话单
   */
  getTables() {
    const sql = `select * from sqlite_master where type = 'table' and (name like '移动%' or name like'联通%' or name like '电信%')`;
    return this.db.query(sql);
  }

  /**
   * 获取表的所有记录
   * @param tableName 
   */
  getRecords(tableName) {
    const sql = `select * from '${tableName}'`;
    console.log(sql);
    return this.db.query(sql);
  }

  //获取对端号码统计信息{对端号码，通话次数，总时长}
  getRecordCountInfo(tableName: string) {
    const sql = `select ${Model.OTHER_NUMBER},count(${Model.OTHER_NUMBER}) 通话次数,sum(${Model.DURATION}) 总时长 from \`${tableName}\` group by ${Model.OTHER_NUMBER} order by 通话次数 desc`;
    console.log(sql);
    return this.db.query(sql);
  }

  /**
   * 获取基站的统计信息{lac,ci,count}
   * @param tableName 
   */
  getStationCountInfo(tableName) {
    const sql = `select ${Model.LAC},${Model.CI},count(*) count from \`${tableName}\` group by ${Model.LAC},${Model.CI} order by count desc`;
    // console.log(sql);
    return this.db.query(sql);
  }

  /**
   * 删除话单
   * @param tableName 
   */
  delTable(tableName) {
    const sql = `drop table if exists \`${tableName}\` `;
    return this.db.query(sql);
  }

  /**
   * 获取话单中通话次数最多的基站的前十名
   * @param tableName 
   */
  getTopTenStations(tableName) {
    const sql =
      `select a.* from "${tableName}" a, 
    (select lac,ci,count(*) count from "${tableName}" where lac!='' and ci!='' group by lac,ci order by count desc limit 10) b 
    on (a.lac == b.lac and a.ci = b.ci) `;
    return this.db.query(sql);
  }

  /**
   * 获取所有话单组合的共同联系人，话单组合是一个二维数组，[[话单1，话单2],[话单2，话单3],....]
   * @param allCombitions 所有的组合
   */
  getAllCommonContacts(allCombitions: any[]) {
    let sql = '';
    for (let i = 0; i < allCombitions.length; i++) {
      let tableNames = '';
      for (let j = 0; j < allCombitions[i].length; j++) {
        tableNames += (allCombitions[i][j] + ' | ');
      }
      tableNames = tableNames.substr(0, tableNames.length - 3);
      sql += `select ${Model.OTHER_NUMBER},${Model.COUNT_TABLE}, ${Model.TABLE_NAME} from (`
      for (let j = 0; j < allCombitions[i].length; j++) {
        let table = allCombitions[i][j];
        sql += `select ${Model.OTHER_NUMBER},'${allCombitions[i].length}' ${Model.COUNT_TABLE}, '${tableNames}' ${Model.TABLE_NAME} from "${table}" InterSect `
      }
      sql = sql.substr(0, (sql.length - 'InterSect '.length)) + ')';
      if (i != allCombitions.length - 1) {
        sql += ' union '
      }
    }
    console.log(sql);
    return this.db.query(sql);
  }

  /**
   * /获取共同联系人号码的通话记录
   * @param number 话单数量
   * @param tables 话单名称，数组
   */
  getRecordsByNumberAndTable(number, tables: string[]) {
    let sql = "";
    for (let i = 0; i < tables.length; i++) {
      let table = tables[i];
      sql += `select ${Model.CALL_TYPE},${Model.OTHER_NUMBER},${Model.START_TIME},${Model.DURATION},'${table}' ${Model.TABLE_NAME},${Model.LAC},${Model.CI},lng,lat,addr,acc
      from \`${table}\`
      where ${Model.OTHER_NUMBER} = '${number}' `
      if (i != tables.length - 1) {
        sql += 'union '
      }
    }
    console.log(sql);
    return this.db.query(sql);
  }
}