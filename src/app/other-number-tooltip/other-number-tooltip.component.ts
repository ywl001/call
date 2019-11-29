import { Component, OnInit } from '@angular/core';
import { ITooltipAngularComp } from '@ag-grid-community/angular';
import { Model } from '../models/model';

@Component({
  selector: 'app-other-number-tooltip',
  templateUrl: './other-number-tooltip.component.html',
  styleUrls: ['./other-number-tooltip.component.css']
})
export class OtherNumberTooltipComponent implements ITooltipAngularComp {

  num = '';
  insertTime = ''
  name = '';

  agInit(params): void {
    console.log('tooltip');
    let data = params.api.getDisplayedRowAtIndex(params.rowIndex).data;
    if (data[Model.OTHER_NUMBER] && data[Model.INSERT_TIME]) {
      this.name = data[Model.CONTACT]
      this.num = data[Model.OTHER_NUMBER];
      this.insertTime = data[Model.INSERT_TIME].substr(0, 10)+'添加';
    }
  }

}
