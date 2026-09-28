import { Component } from '@angular/core';

import { DialogRef } from '../../services/dialog/dialog-ref';
import { GenericBaseDialogComponent } from './generic-base-dialog.component';

@Component({template:''})
export abstract class BaseDialogComponent<T> extends GenericBaseDialogComponent<T, boolean>{
   
    constructor(modalRef: DialogRef) {
        super(modalRef);
    }

}