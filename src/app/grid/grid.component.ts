import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as EventBus from 'eventbusjs';
import * as toastr from 'toastr';
import * as XLSX from 'xlsx';
import { EventType } from '../models/event-type';

import { SqlService } from '../services/sql.service';
import { Model } from './../models/model';
import { DbService } from './../services/db.service';
import { OtherNumberFilterComponent } from '../other-number-filter/other-number-filter.component';
import { Station } from '../models/station';
import { Record } from '../models/record';
import { AgGridAngular } from '@ag-grid-community/angular';
import { ColumnApi, GridApi, CellEvent, CellValueChangedEvent, Module } from '@ag-grid-community/core';
import { LocalStorgeService } from '../services/local-storge.service';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { OtherNumberTooltipComponent } from '../other-number-tooltip/other-number-tooltip.component';
import { PositionComponent } from '../position/position.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css']
})
export class GridComponent {

  private _state: number;

  @ViewChild('agGrid', { static: false })
  agGrid: AgGridAngular;

  /**是否显示返回按钮，class绑定*/
  isShowBtnBack: boolean;

  /**是否显示显示基站位置按钮，class绑定*/
  isShowBtnLocation

  /**是否显示存储显示内容的按钮 class绑定*/
  isShowBtnSave;

  /**是否显示几个设置行样式的按钮 */
  isShowBtnStyle

  private columnApi: ColumnApi;
  private gridApi: GridApi;

  //存储话单统计的数据
  private recordsCountList;

  /**存储共同联系人数据，数据返回使用*/
  private commonContactsList

  //表格数据,rowdata绑定
  gridData;
  /**列定义绑定 */
  columnDefs;
  /**组件绑定 */
  frameworkComponents;
  /**国际化字符绑定 */
  localeText;

  //** 单击，双击的判断 */
  private isClick;

  /**是否处于编辑状态，编辑状态时，点击不能使用 */
  private isEdit;

  modules: Module[] = [ClientSideRowModelModule];

  constructor(
    private dbService: DbService,
    private localStorgeService: LocalStorgeService,
    private changeRef: ChangeDetectorRef,
    private sqlService: SqlService,
    private positionDialog: MatDialog
  ) {

    this.frameworkComponents = {
      myFilter: OtherNumberFilterComponent,
      myTooltip: OtherNumberTooltipComponent
    }

    /**国际化文本 */
    this.localeText = {
      // for text filter
      contains: '包含',
      notContains: '不包含',
      startsWith: '开始于',
      endsWith: '结束于',
      filterOoo: '过滤。。。',
      applyFilter: '过滤完成',
      equals: '等于',
      notEqual: '不等于',
      andCondition: '并且',
      orCondition: '或者',
    }

    EventBus.addEventListener(EventType.SHOW_RECORDS, e => { this.showRecords(e.target) });
  }

  //ready 事件监听，主要获取gridapi，和columnapi
  onGridReady(params) {
    console.log('on grid ready')
    this.columnApi = params.columnApi;
    this.gridApi = params.api;
    //设置ag-grid控件tooltip的显示时间
    try {
      (params.api as any).context.beanWrappers.tooltipManager.beanInstance.MOUSEOVER_SHOW_TOOLTIP_TIMEOUT = 0.5;
    } catch (e) {
      console.error(e);
    }
  }

  ////////////////////////////////////////数据显示////////////////////////////////////////////

  set state(value) {
    if (!value) return;
    this._state = value;

    if (value == Model.RECORDS_STATE) {
      this.setBtnVisible(Model.isShowBtnBack, true, true, true)
      this.setRowStyle("record");
      EventBus.dispatch(EventType.OPEN_MIDDLE, 550);
    } else if (value == Model.RECORD_COUNT_STATE) {
      this.setBtnVisible();
      this.setRowStyle("none");
      EventBus.dispatch(EventType.OPEN_MIDDLE, 380);
    } else if (value == Model.COMMON_CONTACTS_STATE) {
      this.setBtnVisible();
      this.setRowStyle("none");
      EventBus.dispatch(EventType.OPEN_MIDDLE, 450);
    } else if (value == Model.RECORDS_COMMON_CONTACTS_STATE) {
      this.setBtnVisible(true, false, false, false);
      this.setRowStyle("contactRecord");
      EventBus.dispatch(EventType.OPEN_MIDDLE, 1);
    }
    this.columnDefs = this.getColDefs(value);
  }

  get state(): number {
    return this._state;
  }

  /** 显示数据 */
  private showRecords(data) {
    this.onClearFilter();
    this.state = data.state;
    let records = data.data;

    if (this.state == Model.RECORD_COUNT_STATE) {
      this.recordsCountList = records;
    } else if (this.state == Model.COMMON_CONTACTS_STATE) {
      this.commonContactsList = records;
    }

    this.addContactsInfo(records);
    this.gridData = records;

    this.changeRef.detectChanges();
  }

  /** 设置几个按钮是否显示 1、返回按钮 2、基站按钮 3、过滤按钮*/
  private setBtnVisible(isShowBtnBack = false, isShowBtnLocation = false, isShowBtnSave = false, isShowBtnStyle = false) {
    this.isShowBtnBack = isShowBtnBack;
    this.isShowBtnLocation = isShowBtnLocation;
    this.isShowBtnSave = isShowBtnSave;
    this.isShowBtnStyle = isShowBtnStyle;
  }

  /**设置行风格， none\record*/
  private setRowStyle(type) {
    console.log('rowstyle')
    switch (type) {
      case "none":
        this.agGrid.gridOptions.getRowStyle = (params) => {
          return { background: null, color: null }
        };
        break;

      case "contactRecord":
        this.agGrid.gridOptions.getRowStyle = (params) => {
          let tables = Model.tables;
          // console.log(tables)
          for (let i = 0; i < tables.length; i++) {
            if (params.data.话单名称 == tables[i].name) {
              let color;
              switch (i % 4) {
                case 0:
                  color = 'lightblue';
                  break;
                case 1:
                  color = 'lightgreen';
                  break;
                case 2:
                  color = 'lightskyblue';
                  break;
                case 3:
                  color = 'lightyellow';
                  break;

                default:
                  color = 'lightgray'
                  break;
              }
              return { background: color };
            }
          }
        }
        break;

      case "record":
        this.agGrid.gridOptions.getRowStyle = (params) => {
          let color;
          let background;
          if (params.data.lat == 0 || params.data.lng == 0) {
            color = '#888888';
            background = '#eeeeee';
          }
          let key = Model.currentTable + '_' + params.data.id;
          let value = this.localStorgeService.get(key);
          switch (value) {
            case '1':
              color = '#ffff00';
              background = '#ff0000'
              break;

            case '2':
              color = '#ffffff';
              background = '#34A835'
              break;

            case '3':
              color = '#ffffff';
              background = '#0000ff'
              break;
          }
          return { color: color, background: background }
        }
        break;
    }
  }

  /**根据状态获取列定义 */
  private getColDefs(state) {
    let colDefs: any[] = [];
    let col_otherNumber = {
      headerName: Model.OTHER_NUMBER_CN,
      colId: Model.OTHER_NUMBER_CN,
      editable: true,
      sortable: true,
      tooltipField: Model.CONTACT,//这个值会触发信息提示，如果为空则不触发
      tooltipComponent: "myTooltip",
      filter: "myFilter",
      //获取或设置值
      valueGetter: (params) => {
        return params.data.contact ? params.data.contact : params.data[Model.OTHER_NUMBER]
      },
      valueSetter: (params) => {
        params.data.contact = params.newValue;
      }
    }
    colDefs.push(col_otherNumber);
    let cols;
    if (state == Model.RECORDS_STATE) {
      cols = [
        this.createColDef(Model.START_TIME_CN, Model.START_TIME),
        this.createColDef(Model.CALL_TYPE_CN, Model.CALL_TYPE),
        this.createColDef(Model.DURATION_CN, Model.DURATION),
        this.createColDef(Model.LAC_CN, Model.LAC),
        this.createColDef(Model.CI_CN, Model.CI)
      ]
    } else if (state == Model.RECORD_COUNT_STATE) {
      cols = [
        this.createColDef(Model.COUNT_CALL, Model.COUNT_CALL),
        this.createColDef(Model.TOTAL_TIME, Model.TOTAL_TIME),
      ]
    } else if (state == Model.COMMON_CONTACTS_STATE) {
      cols = [
        this.createColDef(Model.TABLE_NAME, Model.TABLE_NAME),
        this.createColDef(Model.COUNT_TABLE, Model.COUNT_TABLE),
      ]
    } else if (state == Model.RECORDS_COMMON_CONTACTS_STATE) {
      cols = [
        this.createColDef(Model.START_TIME_CN, Model.START_TIME),
        this.createColDef(Model.CALL_TYPE_CN, Model.CALL_TYPE),
        this.createColDef(Model.DURATION_CN, Model.DURATION),
        this.createColDef(Model.TABLE_NAME, Model.TABLE_NAME)
      ]
    }

    return colDefs.concat(cols);;
  }

  private createColDef(headerName, field) {
    return ({ headerName: headerName, field: field, colId: field, sortable: true, filter: true })
  }

  /** 增加联系人信息*/
  private addContactsInfo(data) {
    for (let i = 0; i < data.length; i++) {
      let num = data[i][Model.OTHER_NUMBER];
      let o = Model.Contacts.get(num);
      if (o) {
        data[i][Model.CONTACT] = o.name;
        data[i][Model.INSERT_TIME] = o.insertTime;
      }
    }
  }

  onRowDataChange(e) {
    console.log('on row data change')
    if (this.gridData.length > 0) {
      this.autoSizeAll();
    }
  }

  //自动设置列宽度
  private autoSizeAll() {
    let allColumnIds = [];
    this.columnApi.getAllColumns().forEach(function (column) {
      allColumnIds.push(column.getColId());
    });
    this.columnApi.autoSizeColumns(allColumnIds);
  }

  onDataChange(e) {
    console.log("change....");
  }

  ////////////////////////////////////////表格事件/////////////////////////////////////////

  //click
  onClickConfirm(e: CellEvent) {
    this.isClick = true;
    //发送事件，禁止中间容器缩放
    if ((e.colDef.headerName == Model.OTHER_NUMBER_CN) ||//对端号码时
      ((e.colDef.headerName == Model.LAC_CN || e.colDef.headerName == Model.CI_CN)
        && (e.data.lat == 0 || e.data.lng == 0)))//基站代码或小区号 并且 位置不存在时
    {
      EventBus.dispatch(EventType.IS_CAN_RESIZE_MIDDLE, false);
    }

    setTimeout(() => {
      if (this.isClick) {
        if (e.colDef.headerName == Model.OTHER_NUMBER_CN) {
          EventBus.dispatch(EventType.IS_CAN_RESIZE_MIDDLE, true);
        }
        //单击单元格逻辑
        this.onClickCell(e);
      }
    }, 500);
  }

  //单击表中内容，显示基站位置或显示号码通话记录（统计表）
  private onClickCell(e: CellEvent) {
    //处于编辑状态时，不做相应
    if (this.isEdit)
      return;
    //通话记录表，单击显示基站位置
    if (this.state == Model.RECORDS_STATE || this.state == Model.RECORDS_COMMON_CONTACTS_STATE) {
      const rowData = e.data;
      if (rowData.lng == 0 || rowData.lat == 0) {
        toastr.info('该基站在数据库没有找到位置信息')
      } else {
        let station = Station.toStation(rowData);
        this.addRecordIdToStation(station);
        EventBus.dispatch(EventType.CLOSE_LEFT, false);
        EventBus.dispatch(EventType.SHOW_STATION, station);
      }
    }
    //统计表，单击后显示号码通话详情
    else if (this.state == Model.RECORD_COUNT_STATE) {
      console.log("显示该号码");
      const rowData = e.data;
      const num = rowData[Model.OTHER_NUMBER];
      let data = this.getRecordsByNumber(num);

      this.showRecords({ data: data, state: Model.RECORDS_STATE })
    }
    //共同联系人号码详情
    else if (this.state == Model.COMMON_CONTACTS_STATE) {
      let otherNumber = e.data[Model.OTHER_NUMBER];
      let tables = e.data[Model.TABLE_NAME].split(' | ')
      this.dbService.getRecordsByNumberAndTable(otherNumber, tables)
        .done(res => {
          this.showRecords({ data: res, state: Model.RECORDS_COMMON_CONTACTS_STATE })
        })
    }
  }

  /**获取表格内相同基站位置的记录id，保存到station中的recordIds*/
  private addRecordIdToStation(station: Station) {
    let countRecord = this.gridApi.getDisplayedRowCount();
    for (let i = 0; i < countRecord; i++) {
      let element = this.gridApi.getDisplayedRowAtIndex(i).data;
      let s = Station.toStation(element)
      if (station.isSame(s)) {
        station.recordIDs.push(element.id);
      }
    }
  }

  //双击时
  onDoubleClick(e: CellEvent) {
    //避免双击造成触发单击事件
    this.isClick = false;
    console.log('db click')

    //设置未知基站位置
    if ((e.colDef.headerName == Model.LAC_CN || e.colDef.headerName == Model.CI_CN)
      && (e.data.lat == 0 || e.data.lng == 0)) {
      console.log('双击没有位置')
      if (Model.isDialogClosed) {
        // this.positionDialog.open(PositionComponent, { data: { lac: e.data.lac, ci: e.data.ci, gridData: this.gridData } })
        EventBus.dispatch(EventType.SHOW_DIALOG,{ lac: e.data.lac, ci: e.data.ci, gridData: this.gridData })
        Model.isDialogClosed = false;
      }
    } else if (e.colDef.headerName == Model.OTHER_NUMBER_CN) {
      console.log("edit true")
      this.isEdit = true;
    }
    //当双击对端号码时，关闭页面的缩放
    EventBus.dispatch(EventType.IS_CAN_RESIZE_MIDDLE, true);
  }

  //当修改单元格内容后
  onCellValueChange(e: CellValueChangedEvent) {
    console.log('cell value change');
    if(!this.isEdit)
      return;
    this.isEdit = false;
    const otherNumber = e.data[Model.OTHER_NUMBER];
    //空白号码的处理，不能做修改
    if (otherNumber == '') {
      toastr.warning('请勿修改空白号码');
      e.node.setDataValue(Model.OTHER_NUMBER_CN, e.oldValue);
      return;
    }
    this.sqlService.insertOrUpdateContects(e.data[Model.OTHER_NUMBER], e.newValue)
      .subscribe(
        res => {
          if (res) {
            Model.Contacts.set(e.data[Model.OTHER_NUMBER], { name: e.newValue, insertTime: new Date().toLocaleDateString() });
            this.showRecords({ data: this.gridData, state: this.state });
          } else {
            toastr.warning('修改失败，请将对端号码转为文本格式后重新导入');
          }
        }
      )
  }

  /** 单击按钮显示表中的基站位置*/
  onShowLocations(e) {
    //显示忙碌图标
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, true);
    //如果不setTimeout,会造成show busy icon 没空执行，cup估计被后面的占用了，没有效果。
    setTimeout(() => {
      let stations = this.getRecordsStations();
      if (stations.length > 0) {
        EventBus.dispatch(EventType.SHOW_STATIONS, stations);
      } else {
        toastr.info('话单中没有位置信息');
        EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
      }
    }, 300);
  }

  /**获取当前表的基站信息 */
  private getRecordsStations() {
    //获取当前表格中行数
    let len = this.gridApi.getDisplayedRowCount();
    let records: Array<Record> = [];

    //获取基站的唯一值
    for (let i = 0; i < len; i++) {
      let row = this.gridApi.getDisplayedRowAtIndex(i).data;
      records.push(row)
    }
    return Record.toStations(records);
  }

  /**获取相同对端号码的记录 */
  private getRecordsByNumber(otherNumber) {
    let records = Model.allRecords;
    let res: any[] = [];
    records.forEach(element => {
      if (element[Model.OTHER_NUMBER] == otherNumber) {
        res.push(element);
      }
    });
    return res;
  }

  /**单击存储当前数据按钮 */
  onClickBtnSave(index) {
    this.isClick = true;
    EventBus.dispatch(EventType.IS_CAN_RESIZE_MIDDLE, false);
    setTimeout(() => {
      if (this.isClick) {
        EventBus.dispatch(EventType.IS_CAN_RESIZE_MIDDLE, true);
        //根据索引判断是否有存储，如果有，使用存储的，没有则设置
        let key = this.getSaveKey(index)
        let ids = this.localStorgeService.getObject(key);
        let arr = Object.keys(ids)
        if (arr.length > 0) {
          this.onClearFilter()
          let records = this.idsToRecords(ids);
          this.gridData = records;
        } else {
          this.saveDisplayData(key);
        }
      }
    }, 500);
  }

  /**根据索引获取存储的键 */
  private getSaveKey(index) {
    return Model.currentTable + '_f' + index;
  }

  private idsToRecords(ids): Array<Record> {
    let records = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      //字符串key还得转数字，否则获取不到值。。。
      let record = Model.allRecordsMap.get(+id);
      if (record) records.push(record)
    }
    return records;
  }

  /**双击按钮清除存储数据*/
  onDoubleClickBtnSave(index) {
    this.isClick = false;
    //删除存储的过滤器
    let key = this.getSaveKey(index);
    localStorage.removeItem(key)//删除磁盘保存的

    setTimeout(() => {
      EventBus.dispatch(EventType.IS_CAN_RESIZE_MIDDLE, true);
    }, 500);
    console.log('db click');
  }

  //存储当前表格的显示数据
  private saveDisplayData(key) {
    let ids = [];
    let selectedRows = this.gridApi.getSelectedRows();
    //不是单选的情况下，存储选中数据
    if (selectedRows.length > 1) {
      for (let i = 0; i < selectedRows.length; i++) {
        ids.push(selectedRows[i].id);
      }
    } else {
      let count = this.gridApi.getDisplayedRowCount();
      for (let i = 0; i < count; i++) {
        ids.push(this.gridApi.getDisplayedRowAtIndex(i).data.id)
      }
    }

    this.localStorgeService.setObject(key, ids);
  }

  //清除表格过滤
  onClearFilter() {
    this.gridApi.setFilterModel(null);
    this.gridApi.onFilterChanged();
  }

  //获取过滤按钮的图标，和html绑定
  getBtnSaveIconUrl(index) {
    let key = this.getSaveKey(index);
    let data = this.localStorgeService.get(key);
    if (!data) {
      return `url(assets/f${index}_false.png)`;
    }
    return `url(assets/f${index}.png)`;
  }

  /**设置样式按钮的背景图案 */
  getBtnColorIconUrl(index) {
    return `url(assets/c${index}.png)`;
  }

  /**设置选择行的样式 */
  onClickBtnStyle(index) {
    let selectRows = this.gridApi.getSelectedRows();
    for (let i = 0; i < selectRows.length; i++) {
      const r = selectRows[i];
      this.localStorgeService.set(Model.currentTable + '_' + r.id, index);
    }
    this.setRowStyle('record')
    this.gridApi.redrawRows();
  }

  /**清除选择行的样式 */
  onClearStyle() {
    let selectRows = this.gridApi.getSelectedRows();
    for (let i = 0; i < selectRows.length; i++) {
      const r = selectRows[i];
      this.localStorgeService.remove(Model.currentTable + '_' + r.id)
    }
    this.setRowStyle('record')
    this.gridApi.redrawRows();
  }

  onClickBack() {
    if (this.recordsCountList) {
      this.showRecords({ data: this.recordsCountList, state: Model.RECORD_COUNT_STATE });
    } else if (this.commonContactsList) {
      this.showRecords({ data: this.commonContactsList, state: Model.COMMON_CONTACTS_STATE });
    }
  }

  onClickExcel() {
    let count = this.gridApi.getDisplayedRowCount();
    let data = [];
    for (var i = 0; i < count; i++) {
      var rowNode = this.gridApi.getDisplayedRowAtIndex(i);
      data.push(rowNode.data);
    }
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    let fileName = Model.currentTable ? Model.currentTable : "共同联系人"
    XLSX.writeFile(wb, fileName + ".xlsx");
  }

}
