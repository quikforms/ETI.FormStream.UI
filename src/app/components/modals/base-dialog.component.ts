import { Component } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap/modal';
import { GenericBaseDialogComponent } from './generic-base-dialog.component';

@Component({template:''})
export abstract class BaseDialogComponent<T> extends GenericBaseDialogComponent<T, boolean>{
   
    constructor(modalRef: BsModalRef) {
        super(modalRef);
    }

}