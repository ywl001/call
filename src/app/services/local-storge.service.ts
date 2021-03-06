import { Injectable } from '@angular/core';
import { Model } from '../models/model';

@Injectable({
  providedIn: 'root'
})
export class LocalStorgeService {

  public localStorage:any;

    constructor() {
        if (!window.localStorage) {
            throw new Error('Current browser does not support Local Storage');
        }
        this.localStorage = window.localStorage;
    }

    public set(key:string, value:string):void {
        this.localStorage[key] = value;
    }

    public get(key:string):string {
        return this.localStorage[key] || false;
    }

    public setObject(key:string, value:any):void {
        this.localStorage[key] = JSON.stringify(value);
    }

    public getObject(key:string):any {
        return JSON.parse(this.localStorage[key] || '{}');
    }

    public remove(key:string):any {
        this.localStorage.removeItem(key);
    }
}
