import { Component, Input, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, takeUntil } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { BaseComponent } from '../base.component';
import { FormStreamSelectors } from '../../state/reducers/formstream.reducer';
import { AuthTokenService } from '../../services/token.service';
import { FormStreamModalService } from '../../services/formstream-modals.service';
import { AttachedFile } from '../../state/models/attached-file.model';
import { AttachmentsSelectors } from '../../state/reducers/attachments.reducer';
import { TryRemoveUploadedFile } from '../../state/actions/attachments.actions';
import { FormStreamData } from '../../state/models/Response/formstream-data.model';
import { EsignData } from '../../state/models/Response/esign-data.model';
import { SetFormStreamData, TrySaveForms, TryPrintForms } from '../../state/actions/formstream.actions';
import { SetErrorNotification } from '../../state/actions/notification.actions';
import { TryLoadFormStreamConfig } from '../../state/actions/configuration.actions';
import { ApiConfig } from '../../../environments/api-config';
import { FormRenderService, RenderedForm } from '../../services/form-render.service';
import { FormCompletionService } from '../../services/form-completion.service';
import { FormCompletion, computeCompletion } from '../../state/models/render/form-completion';
import { ProcessedSection } from '../../state/models/render/render-model';
import { SaveFormService } from '../../services/save-form.service';
import { PrintFormService } from '../../services/print-form.service';
import { LOGO_FORMSTREAM, LOGO_QUIK, LOGO_QUIK_BORDER } from './logos';

@Component({
  selector: 'quik-formstream',
  templateUrl: './formstream.component.html',
  styleUrls: ['./formstream.component.less']
})
export class FormStreamComponent extends BaseComponent implements OnInit, OnDestroy {

  // Single intake pathway: parse the host payload, set tokens, push to the store.
  @Input()
  set formStreamData(value: any[]) {
    if (!value || value.length === 0) { return; }
    this.intakeFormStreamData(value[0]);
  }

  // Optional API endpoints override, for first-party non-production embeddings only. The distributed
  // bundle already targets production, so a public consumer never sets this and stays on production;
  // when a host provides it, the given keys replace the production base URLs (others are kept). All
  // API calls are user-triggered, so an override set right after connect applies before any request.
  @Input()
  set apiConfig(value: Partial<ApiConfig> | null | undefined) {
    if (!value) { return; }
    this._store.dispatch(new TryLoadFormStreamConfig(value));
  }

  // Brand logos, inlined as data URIs (see ./logos) so the element requests no external assets.
  readonly logoFormstream = LOGO_FORMSTREAM;
  readonly logoQuik = LOGO_QUIK;
  readonly logoQuikBorder = LOGO_QUIK_BORDER;

  // V2 render state. selectedIndex is the single source of truth; the selected form
  // and the "Form X of N" label are derived from it (see getters below).
  renderedForms: RenderedForm[] = [];
  selectedIndex = 0;
  completions$: Observable<FormCompletion[]> = of([]);
  unid = '';
  customerId = '';
  packageId: string | number = '';
  packageName = '';   // sourced from the payload when a saved package is reloaded; otherwise prompted on first save

  // E-signature baseline — present only on the launcher audience when a vendor was selected; gates the
  // "Send for Signature" button and feeds the send modal.
  esignData: EsignData | null = null;

  // Attachments — sourced via transaction.unid
  attachedFiles$: Observable<AttachedFile[]> = this._store.select(AttachmentsSelectors.getAttachedFiles);
  attachedFiles: AttachedFile[] = [];

  loading$: Observable<boolean> = combineLatest([
    this._store.select(FormStreamSelectors.isLoading),
    this._store.select(AttachmentsSelectors.isRemoveFileLoading)
  ]).pipe(map(([formLoading, removeFileLoading]) => formLoading || removeFileLoading));

  // UI state
  showSections = false;

  // Derived from selectedIndex — no separate field to keep in sync.
  get selectedForm(): RenderedForm | null { return this.renderedForms[this.selectedIndex] ?? null; }
  get formIndexLabel(): string {
    return this.renderedForms.length ? `Form ${this.selectedIndex + 1} of ${this.renderedForms.length}` : '';
  }

  // The "Send for Signature" action is available only when the launcher delivered an e-sign baseline
  // for a supported vendor. DocuSign is the only vendor supported today.
  get canSendForSignature(): boolean {
    return this.esignData?.vendor === 'Docusign';
  }

  constructor(
    private _store: Store<any>,
    private el: ElementRef<HTMLElement>,
    private _authTokenService: AuthTokenService,
    private _notificationService: FormStreamModalService,
    private _renderService: FormRenderService,
    private _completionService: FormCompletionService,
    private _saveFormService: SaveFormService,
    private _printFormService: PrintFormService) {
    super();
  }

  ngOnInit(): void {
    // Inject the element's global styles only now that an element is actually connected
    // (refcounted in the bundle); removed again in ngOnDestroy so the host is left untouched.
    (window as any).__formStreamInjectStyles?.();

    this.attachedFiles$
      .pipe(filter(files => !!files), takeUntil(this.destroyed$))
      .subscribe(files => { this.attachedFiles = files.map(file => AttachedFile.clone(file)); });

    this._store.select(FormStreamSelectors.getFormStreamData)
      .pipe(filter(data => !!data), takeUntil(this.destroyed$))
      .subscribe(data => this.onFormStreamData(data as FormStreamData));
  }

  ngOnDestroy(): void {
    // Modals mount on document.body, outside the element, so they survive the element being torn down
    // (e.g. the host navigating away). Dismiss any open modal here so nothing lingers over the new page.
    this._notificationService.closeAllModals();
    (window as any).__formStreamRemoveStyles?.();
    super.ngOnDestroy();
  }

  private intakeFormStreamData(rawPayload: any): void {
    try {
      const data = FormStreamData.fromHostPayload(rawPayload);
      this._authTokenService.setTokens(data.transaction.authToken, data.transaction.refreshToken);
      this._store.dispatch(new SetFormStreamData(data));
    } catch {
      this._store.dispatch(new SetErrorNotification('Could not load the form data.'));
    }
  }

  // Build the render-ready forms (structure + Reactive Forms group) from the store payload.
  private onFormStreamData(data: FormStreamData): void {
    this.unid = data.transaction?.unid ?? '';
    this.customerId = data.transaction?.customerId ?? '';
    this.packageId = data.transaction?.packageId ?? '';
    this.packageName = data.transaction?.formPackageName ?? '';
    this.esignData = data.esignData ?? null;
    this.renderedForms = this._renderService.buildRenderedForms(data);
    this.completions$ = this._completionService.track(this.renderedForms);
    this.selectForm(0);
  }

  // -- Navigation -------------------------------------------------------------

  selectForm(index: number): void {
    if (!this.renderedForms.length) { this.selectedIndex = 0; return; }
    this.selectedIndex = Math.max(0, Math.min(index, this.renderedForms.length - 1));
  }

  navigateToPreviousForm(): void { if (this.selectedIndex > 0) { this.selectForm(this.selectedIndex - 1); } }
  navigateToNextForm(): void { if (this.selectedIndex < this.renderedForms.length - 1) { this.selectForm(this.selectedIndex + 1); } }

  onFormItemKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.selectForm(index); }
  }

  trackByFormId(_index: number, form: RenderedForm): string { return `${form.formId}-${form.formInstance}`; }
  trackBySectionId(_index: number, section: ProcessedSection): string { return section.id; }

  // -- View Sections ----------------------------------------------------------

  toggleSectionsDrawer(): void { this.showSections = !this.showSections; }

  scrollToSection(id: string): void {
    if (!id) { return; }
    const target = this.el.nativeElement.querySelector<HTMLElement>(`[id="${id}"]`) || document.getElementById(id);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.showSections = false;
  }

  // -- Attachments ---------------------------------------

  showAttachmentsModal(): void { this._notificationService.showAttachmentsModal({ unid: this.unid }); }
  removeAttachedFile(fileId: number): void { this._store.dispatch(new TryRemoveUploadedFile(this.unid, fileId)); }

  // -- Action buttons ---------------------------------------------------------

  saveForms(): void {
    if (this.packageName) {
      this.executeSave(this.packageName);
      return;
    }
    this._notificationService.promptForPackageName(this.packageName)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(name => {
        if (!name) { return; }
        this.packageName = name;          // remember it → subsequent saves skip the prompt
        this.executeSave(name);
      });
  }

  private executeSave(packageName: string): void {
    const inputs = this._renderService.toValueInputs(this.renderedForms);
    const request = this._saveFormService.buildRequest(inputs, this.unid, packageName);
    this._store.dispatch(new TrySaveForms(request));
  }

  printForms(): void {
    const inputs = this._renderService.toValueInputs(this.renderedForms);
    const request = this._printFormService.buildRequest(inputs, this.unid, this.customerId);
    this._store.dispatch(new TryPrintForms(request));
  }

  // Entry point for the "Send for Signature" action. When any form still has blank fields, first
  // prompts the user (complete them, or send anyway); otherwise opens the send flow directly.
  sendForSignature(): void {
    if (!this.canSendForSignature) { return; }

    if (this.hasIncompleteForms()) {
      this._notificationService.showConfirmationModal({
        title: 'Incomplete Fields Detected',
        message: 'There are still blank fields in this form. You can either complete them or send for signature anyway.',
        showCancelButton: true,
        showOkButton: true,
        okButtonText: 'Send Anyway',
        cancelButtonText: 'Complete Fields',
        onConfirm: () => this.openSendForSignatureModal()
        // Cancel just closes the prompt, returning the user to the forms to keep filling them.
      });
      return;
    }

    this.openSendForSignatureModal();
  }

  // True when at least one rendered form still has a blank fillable field.
  private hasIncompleteForms(): boolean {
    return this.renderedForms.some(form =>
      computeCompletion(form.formGroup.value as Record<string, string>, form.fieldDescriptors.length).missing > 0);
  }

  // Opens the send-for-signature modal, seeded with the e-sign baseline and a snapshot of the current
  // form values (the forms are frozen while the modal is open, so this snapshot is what the send uses).
  private openSendForSignatureModal(): void {
    this._notificationService.showSendForSignatureModal({
      esignData: this.esignData,
      formValues: this._renderService.toValueInputs(this.renderedForms),
      customerId: this.customerId,
      packageId: this.packageId,
      forms: this.renderedForms.map(form => ({
        formId: form.metadata.formId,
        formName: form.metadata.formName
      }))
    });
  }

  // Close the sections popover on outside click.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showSections) { return; }
    const target = event.target as HTMLElement | null;
    if (!target || target.closest('.view-sections-tab')) { return; }
    const sectionsPopover = this.el.nativeElement.querySelector('.sections-popover');
    if (!sectionsPopover || !sectionsPopover.contains(target)) { this.showSections = false; }
  }
}
