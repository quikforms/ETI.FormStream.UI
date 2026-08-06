import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

export abstract class ModalService {

    bsModalRef?: BsModalRef;
    modalRefs: BsModalRef[] = [];
    constructor(public modalService: BsModalService) {}

    protected showModal<TModel extends object>(modalComponent: any, model: TModel, timeout?: Number, closeByClickingOutside = true)  {
        
        let modalOptions = {
            ignoreBackdropClick: !closeByClickingOutside,
            initialState: model
        };

        this.bsModalRef = this.modalService.show(modalComponent, modalOptions);
        this.modalRefs.push(this.bsModalRef);
        
        if (!!timeout) {
            setTimeout(() => {
                this.bsModalRef.hide();
            }, Number(timeout));
        }
    }

    public closeAllModals() {
        this.modalRefs.forEach(modal => modal.hide());
    }
}
