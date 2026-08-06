import { Component, HostListener } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';



@Component({template:''})
export abstract class GenericBaseDialogComponent<T,R>{
   
    private readonly ESCAPE_KEY_CODE = 27;

    @HostListener('document:keyup', ['$event']) handleKeyUp(event: any) {
        if (event.keyCode === this.ESCAPE_KEY_CODE) {
            this.modalRef.hide();
        }
    }

    @HostListener('document:mousedown', ['$event', '$event.target']) handleMousedown(event: any, targetElement: HTMLElement): void {
        if (!targetElement) {
            return;
        }
    }

    constructor(public modalRef: BsModalRef) {
    }

    close() {
        this.modalRef.hide();
    }
}