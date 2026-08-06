import { Injectable } from "@angular/core";
import { BsModalService } from "ngx-bootstrap/modal";
import { Observable, Subject } from "rxjs";
import { ModalService } from "./modal.service";
import { AttachmentsComponent, AttachmentsModel } from "../components/attachments/attachments.component";
import { ConfirmComponent, ConfirmModel } from "../components/modals/confirm-modal.component";
import { SendForSignatureComponent, SendForSignatureModel } from "../components/esign/send-for-signature.component";

@Injectable()
export class FormStreamModalService extends ModalService {

    constructor(public modalService: BsModalService) { super(modalService); }

    showAttachmentsModal(model: AttachmentsModel){
        this.showModal(AttachmentsComponent, model);
    }

    showSendForSignatureModal(model: SendForSignatureModel) {
        this.showModal(SendForSignatureComponent, model);
    }

    showConfirmationModal(model: ConfirmModel) {
        this.showModal(ConfirmComponent, model);
    }

    // Prompt for a package name (first-ever save). Bridges the confirm modal's
    // callback API to an Observable so callers get a clean, typed result:
    // the trimmed name, or null if cancelled/empty.
    promptForPackageName(current: string): Observable<string | null> {
        const result = new Subject<string | null>();
        this.showConfirmationModal({
            title: "Save Form Package",
            message: "Enter a name for this form package:",
            showCancelButton: true,
            showOkButton: true,
            okButtonText: "Save",
            cancelButtonText: "Cancel",
            showInput: true,
            inputPlaceholder: "Package name",
            inputValue: current,
            inputRequired: true,
            onConfirm: (name: string) => { result.next(name?.trim() || null); result.complete(); },
            onCancel: () => { result.next(null); result.complete(); },
        });
        return result.asObservable();
    }
}