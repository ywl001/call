import { ExcelService } from './../services/excel.service';
import { EventType } from './../models/event-type';
import { DbService } from './../services/db.service';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import * as toastr from 'toastr'
import * as EventBus from 'eventbusjs'
import { SqlService } from '../services/sql.service';
import { Router, NavigationEnd } from '@angular/router';
import { MatAccordion } from '@angular/material';
import { Cdma } from '../models/cdma';
import { Record } from '../models/record';
import { Model } from '../models/model';
import { Grid } from '@ag-grid-community/core';
import { GridComponent } from '../grid/grid.component';


/**第三方类的定义 */
declare var alertify;
declare var gcoord;

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})

export class MenuComponent implements OnInit {

  // 话单列表
  tables:Array<any>;

  // 运营商类型
  choseType; // 和单选组绑定
  private yysType; // 实际的运营商类型

  private tableName;
  isMenuDisable = false;

  /**导航url，在地图组件和帮助组件直接切换 */
  private url;

  private isCDMA: boolean;
  private records: Array<Record>;

  @ViewChild(MatAccordion, { static: false }) accordion: MatAccordion;

  constructor(
    private dbService: DbService,
    private sqlService: SqlService,
    private excelService: ExcelService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
  ) {
    // 当数据库改动时，重新载入
    EventBus.addEventListener(EventType.REFRESH_TABLE, e => { this.onRefreshTable(e) });
  }

  ngOnInit() {
    this.tables = [];
    this.getTables();
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) { // 当导航成功结束时执行
        this.url = e.url;
      }
    });
  }

  private getMnc(value: string) {
    if (value === '移动') {
      return 0;
    } else if (value === '联通') {
      return 1;
    } else if (value === '电信') {
      return 11;
    }
  }

  // 获取话单列表
  getTables() {
    this.dbService.getTables()
      .done(tables => {
        this.tables = [];
        this.tables = this.tables.concat(tables);
        Model.tables = tables;
        // setInterval(()=>{this.changeDetectorRef.detectChanges()},200)
        // 触发视图更新
      });
  }

  //运营商选择监听
  onTypeChange(type) {
    this.choseType = type;
    this.yysType = type.value;
    if (type.value == '电信') {
      toastr.info('电信为电信4G基站信息，如果添加cdma话单，格式参照使用说明，并将文件名加cdma前缀');
    }
    if (this.url == '/help') {
      this.router.navigateByUrl('/')
    }
  }

  //添加话单，按钮调用<input type='file'>
  onAddFile() {
    if (!this.choseType) {
      toastr.warning("请选择话单运营商!");
      return;
    }
    document.getElementById("inputFile").click();
  }

  /////////////////////////////////////////添加话单入库的步骤/////////////////////////////////////////////////////
  onFileChange(event) {
    console.time('get exceldata')
    // console.log('on file change')
    //显示忙碌图标
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, true);

    const target: DataTransfer = <DataTransfer>(event.target);

    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    let fileName = target.files[0].name.split('.')[0];

    //判断是否cdma话单
    if (fileName.substr(0, 4).toLowerCase() == 'cdma' && this.yysType == '电信') {
      this.isCDMA = true;
    } else {
      this.isCDMA = false;
    }

    console.log('iscdma', this.isCDMA)
    //获取文件名作为表名
    this.tableName = this.yysType + '_' + fileName;

    this.excelService.importFromExcel(event)
      .subscribe(
        data => {
          //清除对同一文件不触发change
          event.target.value = "";
          if (this.isCDMA) {
            data = this.cdmaData(data);
          }
          console.timeEnd('get exceldata');
          this.excelData = data;
        }
      )
  }

  private cdmaData(data: any[][]) {
    const len = data.length;
    let fields = data[0];
    fields.push(Model.LAC);
    fields.push(Model.CI);
    const cdmaCityIndex = fields.indexOf(Model.CDMA_CITY);
    const cdmaCiIndex = fields.indexOf(Model.CDMA_CI);
    for (let i = 1; i < len; i++) {
      let cityName: string = data[i][cdmaCityIndex];
      if (cityName) {
        cityName = cityName.replace('市', '');
      }
      //sid充当lac列
      const sid = Cdma.CITY_SID_MAP.get(cityName);
      //城市翻译出来的编号
      data[i].push(sid);
      //蜂窝号
      data[i].push(data[i][cdmaCiIndex]);
    }
    return data;
  }

  private set excelData(data) {
    console.time("clean data")
    this.records = this.cleanExcelData(data);
    if (!this.validate(this.records))
      return;
    console.timeEnd("clean data");

    //数据处理完成，开始创建表
    if (this.records.length > 0) {
      this.createTable(this.tableName)
      console.time('insert excel:')
    }
  }

  /**清洗excel数据，舍弃无用的字段，保留有用字段 */
  private cleanExcelData(excelData) {
    let records = [];
    let fieldsMap = Model.fieldsMap;
    let mnc = this.getMnc(this.yysType);

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      let record = new Record();
      record.mnc = mnc;
      for (const key in row) {
        let usefulField = fieldsMap.get(key);
        if (usefulField) {
          let value = row[key];
          if (value) {
            //去除空白字符
            value = value.trim();
            //清楚号码前的86或0086
            if (usefulField == Model.OTHER_NUMBER)
              value = this.clear86(value);

          }
          record[usefulField] = value;
        }
      }
      records.push(record);
    }

    // //lac，ci如果是16进制，转换为10进制
    let isHex = this.isHex(records)
    if (isHex) {
      this.hexToBin(records)
    }

    return records;
  }

  //清除对端号码的86或0086
  private clear86(num) {
    let newNum;
    if (num.length == 13 && num.substr(0, 2) == '86') {
      newNum = num.substr(2, 11);
    }
    else if (num.substr(0, 4) == '0086') {
      newNum = num.substr(4, num.length - 4);
    } else {
      newNum = num;
    }
    return newNum;
  }

  /**判断数据中的基站信息是否16进制 */
  private isHex(data) {
    const re = new RegExp('[a-f]', 'i');
    let len = data.length;
    if (len > 500) len = 500;
    for (let i = 1; i < len; i++) {
      let ci = data[i].ci + '';
      if (ci && ci.search(re) > 0) {
        return true;
      }
    }
    return false;
  }

  /**转换数据中的基站信息为10进制 */
  private hexToBin(records) {
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      r.lac = parseInt(r.lac + '', 16);
      r.ci = parseInt(r.ci + '', 16);
    }
  }

  //验证数据有效性，起码有对端号码，起始时间列
  private validate(records) {
    let fields = [];
    for (const key in records[0]) {
      fields.push(key);
    }
    if (fields.indexOf(Model.OTHER_NUMBER) == -1) {
      alertify.alert(`缺少 ${Model.OTHER_NUMBER} 列，请更改列名称为对端号码`);
      return false;
    }
    if (fields.indexOf(Model.START_TIME) == -1) {
      alertify.alert(`缺少 ${Model.START_TIME} 列，请更改列名称为起始时间`);
      return false;
    }
    return true;
  }

  /**创建表 */
  private createTable(tableName: string) {
    this.dbService.createTable(tableName)
      .done(res => {
        console.log("create table");
        this.insertDB()
      })
      .fail((tx, err) => { this.createTableFail(tx, err) })
  }

  private insertDB() {
    if (this.isHasLocationData(this.records)) {
      console.log('has location')
      this.wgsToBd(this.records);
      let tableData = this.mapToArray(this.records)
      this.insertTableData(this.tableName, tableData)
    }
    else if (this.isHasLbsData(this.records)) {
      //根据lbs 获取location后插入
      console.log("有基站信息")
      let lbsMap = this.getLbsInfo(this.records);
      this.getLbsLocations(lbsMap);
    } else {
      //直接插入
      let tableData = this.mapToArray(this.records)
      this.insertTableData(this.tableName, tableData)
    }
  }

  //插入话单数据
  private insertTableData(tableName, tableData) {
    this.dbService.insertData(tableName, tableData)
      .done(res => {
        console.timeEnd('insert excel:');
        this.getTables();
        toastr.success('话单导入成功');
        EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
      })
      .fail((tx, err) => { this.createTableFail(tx, err) })
  }

  /**map数组转成二维数组,并去除id字段，数据库id自增长无需插入 插入数据库用 */
  private mapToArray(records) {
    let arr = [];
    let fields = [];
    //获取首行
    for (const key in records[0]) {
      if (key != 'id') {
        fields.push(key);
      }
    }
    arr.push(fields);
    //获取数据行
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let item = [];
      for (const key in record) {
        if (key != 'id')
          item.push(record[key])
      }
      arr.push(item);
    }
    return arr;
  }

  /**获取表内基站信息,保存为map对象{"lac:ci":count} */
  private getLbsInfo(records: Array<Record>) {
    let lbsMap: Map<string, number> = new Map();
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (record.lac > 0 && record.ci > 0) {
        let key = `${record.lac}--${record.ci}`;
        if (lbsMap.has(key)) {
          let value = lbsMap.get(key);
          lbsMap.set(key, value++);
        } else {
          lbsMap.set(key, 1)
        }
      }
    }
    return lbsMap;
  }

  /**获取基站的位置信息 */
  private getLbsLocations(lbsMap: Map<string, number>) {
    let sql = this.createSelectLbsLocationSql(lbsMap);
    this.sqlService.selectBySql(sql)
      .subscribe(
        res => {
          //补充记录的位置信息
          for (let i = 0; i < this.records.length; i++) {
            let a = this.records[i];
            for (let j = 0; j < res.length; j++) {
              let b = res[j];
              if (a.lac == b.lac && a.ci == b.ci) {
                a.lat = b.lat;
                a.lng = b.lng;
                a.addr = b.addr;
                a.acc = b.acc;
                continue;
              }
            }
          }
          let tableData = this.mapToArray(this.records)
          this.insertTableData(this.tableName, tableData);
        },
        error => { this.createTableFail('', error) }
      )
  }

  private createSelectLbsLocationSql(lbsMap) {
    let sql = "";
    let mnc = this.getMnc(this.yysType);
    //map 不能使用forin
    lbsMap.forEach((value, key) => {
      let arr = key.split("--")
      let lac = arr[0];
      let ci = arr[1];
      if (lac && ci) {
        if (this.isCDMA) {
          sql += `select mnc,mnc lac,ci,bdlat lat,bdlng lng,addr,acc  from henan where ci = '${ci}' and mnc = '${lac}' union `;
        } else {
          sql += `select mnc,lac,ci,bdlat lat,bdlng lng,addr,acc from henan where lac = '${lac}' and ci = '${ci}' and mnc = ${mnc} union `;
        }
      }
    })

    sql = sql.substr(0, sql.length - 6);
    return sql;
  }

  private createTableFail(tx, err) {
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
    this.removeTable(this.tableName);
    toastr.error('话单导入失败');
    throw new Error(err.message);
  }

  private isHasLocationData(records) {
    let len = records.length;
    if (len > 100) len = 100;
    for (let i = 1; i < len; i++) {
      if (records[i].lat > 0 && records[i].lng > 0)
        return true;
    }
    return false;
  }

  private wgsToBd(records) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let lng = record.lng;
      console.log(lng);
      if (record.lng == 0 || record.lat == 0)
        continue;
      //+号将字符串类型转换未number

      let arr = gcoord.transform(
        [+record.lng, +record.lat],
        gcoord.WGS84,               // 当前坐标系
        gcoord.BD09
      );
      record.lng = arr[0];
      record.lat = arr[1];

      console.log(`transform ${lng} to ${arr[0]}`)
    }
  }

  private isHasLbsData(records) {
    let len = records.length;
    if (len > 100) len = 100;
    for (let i = 1; i < len; i++) {
      if (records[i].lac > 0 && records[i].ci > 0)
        return true;
    }
    return false;
  }

  //////////////////////////////以上是插入话单的步骤//////////////////////////////////////////////
  ///////////////////////////////下面是切换话单列表的逻辑/////////////////////////////////////
  //点击话单列表时
  onClickItem(item) {
    //如果在帮助页面，切换到地图页面
    if (this.url == '/help') {
      this.router.navigateByUrl('/')
    }

    //如果点击的是当前表，不做反应
    if (!item || item == Model.currentTable) {
      return;
    }

    //禁用菜单，直到得到数据
    this.isMenuDisable = true;
    //记录当前操作的话单
    Model.currentTable = item;

    this.dbService.getRecords(item)
      .done(res => {
        this.setAllRecords(res);

        console.log('ok');
        //获取数据后启用菜单
        this.isMenuDisable = false;
      })
      .fail((tx, err) => { throw new Error(err.message) });

    //切换话单要1、清楚表格数据2、清楚地图marker，3、关闭表格
    this.dispatchClearEvent();
  }

  private setAllRecords(res) {
    if (res.length > 0) {
      Model.allRecords = [];
      Model.allRecordsMap = new Map();
      for (let i = 0; i < res.length; i++) {
        const r = res[i];
        Model.allRecords.push(r);
        Model.allRecordsMap.set(r.id, r);
      }
    }
  }

  private dispatchClearEvent() {
    EventBus.dispatch(EventType.CLEAR_GRID_DATA);
    EventBus.dispatch(EventType.CLEAR_MARKER);
    EventBus.dispatch(EventType.OPEN_MIDDLE, 0);
  }

  //删除表
  onRemoveTable(tableName) {
    console.log(tableName);
    alertify.set({
      labels: {
        ok: "确定",
        cancel: "取消"
      }
    });
    alertify.confirm("确定要删除该话单吗？", e => {
      if (e) {
        this.removeTable(tableName);
      }
    });
  }

  private removeTable(tableName) {
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
    this.dbService.delTable(tableName)
      .done(
        res => {
          this.getTables();
          this.removeFilters();
          this.dispatchClearEvent();
        }
      )
  }

  /**
   * 清楚过滤器
   */
  private removeFilters() {
    for (let i = 1; i < 6; i++) {
      //localStorage中键的保存方式
      let key = Model.currentTable + '_f' + i;;
      localStorage.removeItem(key);
    }
  }

  //显示通话详单
  onShowRecords(tableName) {
    Model.isShowBtnBack = false;
    // console.log(Model.allRecords);
    EventBus.dispatch(EventType.SHOW_RECORDS, {data:Model.allRecords,state:Model.RECORDS_STATE});
  }

  //获取话单的次数统计
  onCountRecord(tableName) {
    Model.isShowBtnBack = true;
    this.dbService.getRecordCountInfo(tableName)
      .done(res => {
        EventBus.dispatch(EventType.SHOW_RECORDS, {data:res,state:Model.RECORD_COUNT_STATE});
      })
      .fail((tx, err) => { throw new Error(err.message) })
  }

  //夜间通话记录
  onNightRecord(tableName) {
    Model.isShowBtnBack = false;
    let nightRecords = [];
    let records = Model.allRecords;
    for (let i = 0; i < records.length; i++) {
      let startTime = records[i][Model.START_TIME];
      try {
        const hour = startTime.split(' ')[1].substr(0, 2);
        if (parseInt(hour) <= 5 || parseInt(hour) >= 22) {
          nightRecords.push(records[i]);
        }
      } catch (error) {
        console.log(error.message);
      }
    }
    if (nightRecords.length > 0)
      EventBus.dispatch(EventType.SHOW_RECORDS, {data:nightRecords,state:Model.RECORDS_STATE});
    else
      toastr.error('没有夜间通话记录,请检查起始时间');
  }

  //基站前十名
  onTopTenStations(tableName) {
    this.dbService.getTopTenStations(tableName)
      .done(res => {
        let stations = Record.toStations(res);
        EventBus.dispatch(EventType.SHOW_STATIONS, stations);
        EventBus.dispatch(EventType.SHOW_RECORDS, {data:res,state:Model.RECORDS_STATE});
      })
      .fail((tx, err) => { throw new Error(err.message) });
  }

  //重新加载数据库
  private onRefreshTable(e) {
    this.dbService.getRecords(Model.currentTable)
      .done(res => {
        Model.allRecords = res;
        // EventBus.dispatch(EventType.SHOW_RECORDS, Model.ALL_RECORDS);
      })
  }

  onOverMenu(e) {
    this.playAudio();
  }

  playAudio() {
    let audio = new Audio();
    audio.src = "assets/over.mp3";
    audio.load();
    audio.play();
  }

  //获取多话单共同联系人
  onGetCommonContacts() {
    Model.allRecords = null;
    Model.currentTable = null;
    Model.isShowBtnBack = true;
    this.dispatchClearEvent()

    //关闭打开的话单
    this.accordion.multi = true;
    this.accordion.closeAll();
    this.accordion.multi = false;

    EventBus.dispatch(EventType.SHOW_COMMON_CONTACTS_UI,this.tables);
    // Model.record_count_info = null;
  }

}
