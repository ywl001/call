import { Component, ViewChild, ViewContainerRef, ComponentFactory, ComponentFactoryResolver } from '@angular/core';
import { gsap } from 'gsap'
import { Model } from './models/model';
import { SqlService } from './services/sql.service';
import { HttpClient } from '@angular/common/http';
import * as EventBus from 'eventbusjs'
import { EventType } from './models/event-type';
import { CommonContactsComponent } from './common-contacts/common-contacts.component';
import * as configData from '../assets/config.json';
import { LocationDialogComponent } from './location-dialog/location-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private isLeftOpen = true;
  //中间表格容器是否最大化，最小化，和默认值
  private isMaxMiddle = false;
  private isMinMiddle = true;
  private middleWidth = 500;

  //中间容器是否可以双击改变大小
  private isCanResizeMiddle = true;

  private leftWidth = 260;

  /**是否显示忙碌图标,和class绑定*/
  isShowBusyIcon: boolean;

  /**是否显示对话框 */
  isShowDialog:boolean;

  @ViewChild('commonContacts', { read: ViewContainerRef, static: false }) commonContacts: ViewContainerRef
  @ViewChild('dialog', { read: ViewContainerRef, static: false }) dialog: ViewContainerRef

  constructor(
    private sqlService: SqlService,
    private resolver: ComponentFactoryResolver,
    private http: HttpClient) {
    Model.sqlUrl = configData.sqlUrl;
    Model.isGetLocation = configData.isGetLocation;
    Model.labelType = configData.labelType;
    console.log(Model.sqlUrl + Model.isGetLocation);
    EventBus.addEventListener(EventType.IS_CAN_RESIZE_MIDDLE, e => { this.isCanResizeMiddle = e.target; })
    EventBus.addEventListener(EventType.IS_SHOW_BUSY_ICON, e => { this.isShowBusyIcon = e.target; })
    EventBus.addEventListener(EventType.OPEN_MIDDLE, e => { this.resetMiddle(e.target) });
    EventBus.addEventListener(EventType.CLOSE_LEFT, e => { this.closeLeft() });
    EventBus.addEventListener(EventType.SHOW_COMMON_CONTACTS_UI, e => { this.showCommonContactsUI(e.target) })
    EventBus.addEventListener(EventType.SHOW_DIALOG, e => { this.showDialog(e.target) })
  }

  ngOnInit(): void {
    //获取号码对应的姓名信息
    this.getContacts();
    //获取话单可能的字段
    this.getFieldsMap();
    Model.width = window.innerWidth;
    Model.height = window.innerHeight;
    window.addEventListener('resize', e => {
      Model.height = (<Window>(e.target)).innerHeight;
      Model.width = (<Window>(e.target)).innerWidth;
    })
  }

  // 点击左侧容器开关按钮，面板开启关闭
  onToggleLeft() {
    console.log('toggle left')
    this.isLeftOpen ? this.closeLeft() : this.openLeft();
  }

  //双击中间容器,左侧容器状态不变，中间容器最大化或还原，右侧容器最小化或还原
  onDoubleClickMiddle() {
    if (this.isCanResizeMiddle) {
      this.isMaxMiddle ? this.resetMiddle(1) : this.maxMiddle();
    }
  }

  //双击右侧容器，左侧容器状态不变，右侧最大化或还原，中间最小化或还原
  onDoubleClickRight() {
    this.isMinMiddle ? this.resetMiddle(1) : this.minMiddle();
  }

  //拖动改变表格容器宽度后
  onDragResizeStop(e) {
    this.middleWidth = e.size.width
  }

  /**获取号码联系人信息 保存到Model*/
  private getContacts() {
    Model.Contacts = new Map();
    this.sqlService.selectContactInfo()
      .subscribe(
        res => {
          console.log(res)
          if (res.length > 0) {
            for (let i = 0; i < res.length; i++) {
              const c = res[i];
              Model.Contacts.set(c.number, {name:c.name,insertTime:c.insertTime});
            }
          }
        }
      )
  }

  /**获取话单可用字段 保存到Model*/
  private getFieldsMap() {
    this.http.get("assets/fields.json")
      .subscribe(
        data => {
          Model.fieldsMap = new Map();
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              const fields: Array<string> = data[key];
              for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                Model.fieldsMap.set(field, key);
              }
            }
          }
        }
      )
  }

  private openLeft() {
    gsap.to("#leftContainer", 0.5, { width: this.leftWidth + 'px' });
    gsap.to("#btnToggleLeft", 0.5, { rotation: 0, left: (this.leftWidth+5) + 'px' });
    if (this.isMaxMiddle) {
      gsap.to('#middleContainer', 0.5, { width: Model.width - this.leftWidth + 'px' })
    }
    this.isLeftOpen = true;
  }

  private closeLeft() {
    gsap.to("#leftContainer", 0.5, { width: 0 });
    gsap.to("#btnToggleLeft", 0.5, { rotation: 180, left: 5 + 'px' });
    if (this.isMaxMiddle) {
      gsap.to('#middleContainer', 0.5, { width: Model.width + 'px' })
    }
    this.isLeftOpen = false;
  }

  private maxMiddle() {
    let w = this.isLeftOpen ? Model.width - 260 : Model.width-4;
    gsap.to('#middleContainer', 0.5, { width: w });
    this.isMaxMiddle = true;
    this.isMinMiddle = false;
  }

  private minMiddle() {
    gsap.to('#middleContainer', 0.5, { width: 0 });
    this.isMinMiddle = true;
    this.isMaxMiddle = false;
  }

  /**设定中间表格宽度 
   * @param width 1:使用以前的宽度，其他按数值设定宽度
  */
  private resetMiddle(width) {
    let w = width == 1 ? this.middleWidth : width;
    gsap.to('#middleContainer', 0.5, { width: w });
    this.isMinMiddle = false;
    this.isMaxMiddle = false;
  }

  private showCommonContactsUI(tables) {
    this.commonContacts.clear();
    const factory: ComponentFactory<CommonContactsComponent> = this.resolver.resolveComponentFactory(CommonContactsComponent);
    let componentRef = this.commonContacts.createComponent(factory);
    componentRef.instance.tables = tables;
    componentRef.instance.itself = componentRef;

    let element = <HTMLElement>componentRef.location.nativeElement;
    element.style.position = 'absolute';
    element.style.top = '100px'
    gsap.to(element,{left:262,width:300})
  }

  private showDialog(data){
    console.log("show dialog")
    const factory: ComponentFactory<LocationDialogComponent> = this.resolver.resolveComponentFactory(LocationDialogComponent);
    let componentRef = this.dialog.createComponent(factory);
    componentRef.instance.data = data;
    componentRef.instance.itself = componentRef;

    let element = <HTMLElement>componentRef.location.nativeElement;
    element.style.position = "absolute";
    element.style.width = '100%';
    element.style.height = '100%';
    gsap.from(element,{opacity:0,top:'50%',left:'50%',width:0,height:0});
  }
}
