import { Component, OnInit, ChangeDetectorRef, Input, ComponentRef } from '@angular/core';
import { gsap } from 'gsap';
import { MatSelectionList, MatListOption } from '@angular/material';
import * as toastr from 'toastr'
import * as EventBus from 'eventbusjs'
import { DbService } from '../services/db.service';
import { EventType } from '../models/event-type';
import { Model } from '../models/model';

@Component({
  selector: 'app-common-contacts',
  templateUrl: './common-contacts.component.html',
  styleUrls: ['./common-contacts.component.css']
})
export class CommonContactsComponent {

  constructor(
    private dbService:DbService,
    ) { }

  @Input() tables:string[];

  public itself:ComponentRef<CommonContactsComponent>;

  onClickCancel(){
    this.close();
  }

  onClickOk(commonContacts:MatSelectionList){
    let listOptions:MatListOption[] = commonContacts.selectedOptions.selected;
    let tables = [];
    listOptions.forEach(element => {
      tables.push(element.value);
    });

    if(tables.length < 2){
      toastr.warning('至少选择两个以上话单');
    }else{
      //获取所有话单的组合
      let allCombinations:any[]= this.getArrayCombination(tables);
      // console.log(allCombinations)
      this.dbService.getAllCommonContacts(allCombinations)
      .done(res=>{EventBus.dispatch(EventType.SHOW_RECORDS,{data:res,state:Model.COMMON_CONTACTS_STATE});});
    }
    this.close();
  }

  //获取数组内值的所有组合
  //按照数组长度，转换二进制，并把每个二进制不足部分补0，按照二进制取数组值
  // 000	{}
  // 001	{3}
  // 010	{2}
  // 011	{2,3}
  // 100	{1}
  // 101	{1,3}
  // 110	{1,2}
  // 111	{1,2,3}
  private getArrayCombination(arr: any[]) {
    //肯能产生的组合总数
    let total = Math.pow(2, arr.length) - 1;
    //转换成二进制,取长度
    let len = total.toString(2).length;
    //定义结果集
    let res = [];
    for (let i = 1; i < Math.pow(2, len); i++) {
      //根据数值长度，生产二进制数值
      let arr2 = [];
      let temp = i.toString(2).split('');
      let l2 = len - temp.length;
      for (var j = 0; j < l2; j++) {
        temp.unshift('0');
      }
      // console.log(temp)
      //根据二进制数值，生成新的数值
      for (var k = 0; k < temp.length; k++) {
        if (temp[k] != '0') {
          arr2.push(arr[k]);
        }
      }
      if (arr2.length > 1)
        res.push(arr2);
    }
    return res;
  }

  private close(){
    let element =<HTMLElement>this.itself.location.nativeElement;
    //注意回调函数的写法，直接写this.onTeenComplete,会造成this.itself undefine
    gsap.to(element,{left:-360,onComplete:()=>{this.onTeenComplete()}})
  }

  private onTeenComplete(){
    this.itself.destroy();
  }
}
