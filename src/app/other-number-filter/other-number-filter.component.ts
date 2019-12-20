import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { IFilterAngularComp } from '@ag-grid-community/angular';
import { IFilterParams, IDoesFilterPassParams, IAfterGuiAttachedParams } from '@ag-grid-community/core';
import { Model } from '../models/model';

@Component({
  selector: 'app-other-number-filter',
  templateUrl: './other-number-filter.component.html',
  styleUrls: ['./other-number-filter.component.css']
})
export class OtherNumberFilterComponent implements IFilterAngularComp {

  @ViewChild('input', { read: ViewContainerRef ,static:false}) public input;
  private params: IFilterParams;
  public text: string = '';
  constructor() { }

  agInit(params: IFilterParams): void {
    this.params = params;
  }

  isFilterActive(): boolean {
    return this.text !== null && this.text !== undefined && this.text !== '';
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    let text = this.text.toLocaleLowerCase();
    let otherNumber = params.data[Model.OTHER_NUMBER];
    let contact = params.data[Model.CONTACT];
    console.log(otherNumber,contact)
    if ( otherNumber && otherNumber != '') {
      if (otherNumber.indexOf(text) >= 0) {
        return true
      }
    }
    if (contact) {
      return contact.indexOf(text) >= 0;
    }
    return false;
  }

  getModel(): any {
    return { value: this.text };
  }

  setModel(model: any): void {
    this.text = model ? model.value : '';
  }

  onChange(newValue): void {
    if (this.text !== newValue) {
      this.text = newValue;
      this.params.filterChangedCallback();
    }
  }

  ngAfterViewInit(params: IAfterGuiAttachedParams): void {
    window.setTimeout(() => {
      this.input.element.nativeElement.focus();
    })
  }

}
