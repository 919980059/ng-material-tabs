import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NgMaterialTabsService {

    closeTab: EventEmitter<any> = new EventEmitter<any>(); // 关闭标签

    constructor() {
    }
}
