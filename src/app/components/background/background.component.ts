import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Observable } from 'rxjs';

@Component({
    selector: 'background',
    templateUrl: './background.component.html',
})
export class BackgroundComponent {
    @Input() public show: Observable<boolean>;
    @Output() onClicked: EventEmitter<any> = new EventEmitter();

    constructor() {}

    onBackgroundClick() {
        this.onClicked.emit(true);
    }
}


