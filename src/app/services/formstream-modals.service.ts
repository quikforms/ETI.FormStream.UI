import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { FormStreamDialogService } from "./dialog/dialog.service";
import { AttachmentsComponent, AttachmentsModel } from "../components/attachments/attachments.component";
import { ConfirmComponent, ConfirmModel } from "../components/modals/confirm-modal.component";
import { SendForSignatureComponent, SendForSignatureModel } from "../components/esign/send-for-signature.component";

/**
 * The element's dialogs.
 *
 * The public surface is unchanged from when this sat on ngx-bootstrap's `BsModalService`; what
 * changed is underneath. Dialogs are now rendered inside the shadow root by
 * {@link FormStreamDialogService} instead of being appended to the host's `document.body`, where
 * they fell outside the style boundary in both directions.
 */
@Injectable()
export class FormStreamModalService {

    constructor(private readonly dialogs: FormStreamDialogService) { }

    showAttachmentsModal(model: AttachmentsModel) {
        this.dialogs.show(AttachmentsComponent, model as Partial<AttachmentsComponent>);
    }

    showSendForSignatureModal(model: SendForSignatureModel) {
        this.dialogs.show(SendForSignatureComponent, model as Partial<SendForSignatureComponent>);
    }

    showConfirmationModal(model: ConfirmModel) {
        this.dialogs.show(ConfirmComponent, model as Partial<ConfirmComponent>);
    }

    /** Closes every open dialog. Called when the element is torn down. */
    closeAllModals() {
        this.dialogs.closeAll();
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
