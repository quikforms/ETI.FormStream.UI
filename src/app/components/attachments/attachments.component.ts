import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { ClearSelectedFiles, TryRemoveSelectedFile, TrySelectFiles, TryUploadFiles, UPLOAD_FILES_FAIL, UPLOAD_FILES_SUCCESS } from '../../state/actions/attachments.actions';
import { SetErrorNotification } from '../../state/actions/notification.actions';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BaseDialogComponent } from '../modals/base-dialog.component';
import { Observable } from 'rxjs';
import { AttachmentsSelectors } from '../../state/reducers/attachments.reducer';
import { SelectedFile } from '../../state/models/attached-file.model';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';
import { race } from 'rxjs';

export interface AttachmentsModel {
    unid: string;
}

@Component({
  selector: 'attachments',
  templateUrl: './attachments.component.html',
  styleUrls: ['./attachments.component.less']
})
export class AttachmentsComponent extends BaseDialogComponent<AttachmentsModel> implements AttachmentsModel, OnDestroy {
    
  unid: string;

  addBeforeForms: boolean = false;
  _fileName: string;  
  
  selectedFiles$: Observable<SelectedFile[]> = this._store.select(AttachmentsSelectors.getSelectedFiles);

  loading$: Observable<boolean> = this._store.select(AttachmentsSelectors.isLoading);

  FILE_UPLOAD_CONFIG = {
    MAX_SIZE: 20 * 1024 * 1024, // 20MB
    VALID_TYPES: ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff"]
  }

  constructor(private _store: Store<any>, public modalRef: BsModalRef, private actions: Actions) {
    super(modalRef);
  }

  ngOnDestroy() {
    this._store.dispatch(new ClearSelectedFiles());
  }

  onSelectFiles(fileUploadEvent: any) {
    if (fileUploadEvent.target.files && fileUploadEvent.target.files.length > 0) {
        const files: FileList = fileUploadEvent.target.files;
    
      if (this.validateFiles(files)) {
        const selectedFiles = Array.from(files).map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          file: file
        } as SelectedFile));
        
        this._store.dispatch(new TrySelectFiles(selectedFiles));
      }
    }
  }

  uploadSelectedFiles() {
      this._store.dispatch(new TryUploadFiles(this.unid, this.addBeforeForms));

      race(
        this.actions.pipe(ofType(UPLOAD_FILES_SUCCESS)),
        this.actions.pipe(ofType(UPLOAD_FILES_FAIL))
      ).pipe(
        take(1)
      ).subscribe((action) => {
        this.close();
      });
  }

  revomeSelectedFile(selectedFileId: string){
    this._store.dispatch(new TryRemoveSelectedFile(selectedFileId));
  }

  private validateFiles(files: FileList): boolean {

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!this.FILE_UPLOAD_CONFIG.VALID_TYPES.includes(file.type)) {
        this._store.dispatch(new SetErrorNotification('Unsupported file type. Please upload a PDF, JPG, PNG, GIF, BMP, or TIF file.'));
        return false;
      }

      if (file.size > this.FILE_UPLOAD_CONFIG.MAX_SIZE) {
        this._store.dispatch(new SetErrorNotification('File size exceeds the maximum allowed (20MB).'));
        return false;
      }
    }

    return true;
  }

  close() {
    this.modalRef.hide();    
  }
}