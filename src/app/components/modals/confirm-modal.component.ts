import { Component } from '@angular/core';
import { BaseDialogComponent } from './base-dialog.component';


export enum DefaultButtonClasses {
  BtnRedSignature  = "fs-btn main-color ease"
}

export interface ConfirmModel {
  title?: string;
  message: string;
  showCancelButton: boolean;
  showOkButton: boolean;
  okButtonText?: string;
  cancelButtonText?: string;
  okButtonClass?: string;
  onConfirm?: Function;
  onCancel?: Function;
  showInput?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
  inputRequired?: boolean;
  inputReadonly?: boolean;
}

@Component({
    selector: 'confirm-modal',
    templateUrl: './confirm-modal.component.html',
    styleUrls: ['./confirm-modal.component.less'],
})
export class ConfirmComponent extends BaseDialogComponent<ConfirmModel> implements ConfirmModel {
  title?: string;
  message: string;
  showCancelButton: boolean = true;
  showOkButton: boolean = true;
  okButtonText: string = "Confirm";
  cancelButtonText: string = "Cancel";
  okButtonClass?: string = DefaultButtonClasses.BtnRedSignature;
  onConfirm: Function = () => {};
  onCancel?: Function;
  showInput?: boolean = false;
  inputPlaceholder?: string = '';
  inputValue?: string = '';
  inputRequired?: boolean = false;
  inputReadonly?: boolean = false;


  get isInputValid(): boolean {
    return !this.inputRequired || (this.inputValue?.trim().length > 0);
  }

  confirm() {
    if (this.showInput && this.inputRequired && !this.isInputValid) {
      return;
    }
    
    if (this.showInput) {
      this.onConfirm(this.inputValue?.trim());
    } else {
      this.onConfirm();
    }
    this.modalRef.hide();
  }

  cancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.modalRef.hide();
  }

  override close() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.modalRef.hide();
  }
}
