import { Component, HostListener } from '@angular/core';
import { DialogRef } from '../../services/dialog/dialog-ref';



@Component({template:''})
export abstract class GenericBaseDialogComponent<T,R>{
   
    private readonly ESCAPE_KEY_CODE = 27;

    @HostListener('document:keyup', ['$event']) handleKeyUp(event: any) {
        if (event.keyCode === this.ESCAPE_KEY_CODE) {
            this.modalRef.hide();
        }
    }

    // A document:mousedown handler used to sit here. Its body was empty — it bound the event target
    // and returned either way — so it listened on every mousedown in the page and did nothing with
    // any of them. Nothing replaces it: there is no click-to-dismiss anywhere, here or in the
    // outlet, and DialogOutletComponent's doc comment explains why.

    constructor(public modalRef: DialogRef) {
    }

    close() {
        this.modalRef.hide();
    }
}