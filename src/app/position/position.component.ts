import { Component, OnInit, Inject, ViewChild, ViewContainerRef, Input, ComponentRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DbService } from '../services/db.service';
import { Model } from '../models/model';
import * as EventBus from 'eventbusjs';
import { EventType } from '../models/event-type';
import * as toastr from 'toastr'

declare var gcoord;

@Component({
  selector: 'app-position',
  templateUrl: './position.component.html',
  styleUrls: ['./position.component.css']
})
export class PositionComponent {

  public lat;
  public lng;
  public coordType = 'bd09';

  @ViewChild('root', { read: ViewContainerRef, static: false }) rootDiv: ViewContainerRef;
  
  @Input() data:any;

  itself:ComponentRef<PositionComponent>;

  constructor(
    private dbService: DbService
  ) {
    EventBus.addEventListener(EventType.PICK_MAP_COMPLETE,e=>{this.pickMapComplete(e.target)})
  }

  ngOnInit(): void {
  }

  onCancel() {
    this.close();
  }

  onSubmit() {
    if (!this.validateInput())
      return;

    const lac = this.data.lac;
    const ci = this.data.ci;
    let lat = parseFloat(this.lat);
    let lng = parseFloat(this.lng);
    let gridData = this.data.gridData;

    //对高德和gps坐标的转换
    if (this.coordType == 'gjc02') {
      let arr = gcoord.transform(
        [lng, lat],
        gcoord.GCJ02,               // 当前坐标系
        gcoord.BD09
      );
      lng = arr[0];
      lat = arr[1];
    } else if (this.coordType == 'wgs84') {
      let arr = gcoord.transform(
        [lng, lat],
        gcoord.WGS84,               // 当前坐标系
        gcoord.BD09
      );
      lng = arr[0];
      lat = arr[1];
    }

    this.dbService.updateLatLng(Model.currentTable, lac, ci, lat, lng,
      (tx, res) => {
        console.log(res);
        let rol = res.rowsAffected;
        if (rol === 0) {
          toastr.error('修改失败');
        } else {
          toastr.info(`添加经纬度成功，共修改${rol}条记录`);
          //视图刷新
          //1 更新Model存储所有 
          let allRecords = Model.allRecords;
          let recordsMap = Model.allRecordsMap;
          let len = allRecords.length;
          recordsMap.clear();
          for (let i = 0; i < len; i++) {
            let r = allRecords[i];
            if (r.lac == lac && r.ci == ci) {
              r.lat = this.lat;
              r.lng = this.lng;
            }
            recordsMap.set(r.id, r)
          }
          //2 更新视图
          for (let i = 0; i < gridData.length; i++) {
            const r = gridData[i];
            if (r.lac == lac && r.ci == ci) {
              r.lat = this.lat;
              r.lng = this.lng;
            }
          }
          EventBus.dispatch(EventType.SHOW_RECORDS, { data: gridData, state: Model.RECORDS_STATE })
        }

      },
      (tx, err) => { console.log(err.message) }
    )

    this.close();
  }

  onPickFromMap() {
    console.log('pick');
    let element = <HTMLElement>this.itself.location.nativeElement;
    element.style.display = 'none';
    // this.dialogRef.close();
    EventBus.dispatch(EventType.PICK_MAP,this.data)
  }

  pickMapComplete(data){
    let element = <HTMLElement>this.itself.location.nativeElement;
    element.style.display = 'block';
    this.lat = data.lat;
    this.lng = data.lng;
  }

  private validateInput() {
    let minLng = 73
    let maxLng = 135
    let minLat = 4
    let maxLat = 53;
    let lat = parseFloat(this.lat);
    let lng = parseFloat(this.lng);

    if (!lat || !lng) {
      toastr.error('请输入数字');
      return false;
    }

    if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
      toastr.error('输入的经纬度，不是我国范围，请检查经纬度是否写反了')
      return false;
    }
    return true;
  }

  private close(){
    this.itself.destroy();
    Model.isDialogClosed = true;
  }
}
