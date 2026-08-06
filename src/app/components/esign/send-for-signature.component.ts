import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BaseDialogComponent } from '../modals/base-dialog.component';
import { EsignData } from '../../state/models/Response/esign-data.model';
import { DisplaySigner } from '../../state/models/esign/display-signer.model';
import { buildDisplaySigners } from '../../state/models/esign/signer-display.builder';
import { SEND_TYPE_OPTIONS, DocusignSendType } from '../../state/models/esign/esign-send-type.model';
import { ID_CHECK_OPTIONS } from '../../state/models/esign/esign-auth-type.model';
import { SigningGroupOption } from '../../state/models/esign/signing-group-option.model';
import { buildSigningGroupsRequest } from '../../state/models/esign/signing-group.builder';
import { TryLoadSigningGroups } from '../../state/actions/signing-groups.actions';
import { SigningGroupsSelectors } from '../../state/reducers/signing-groups.reducer';
import { FormValueInput } from '../../state/models/render/form-value.serializer';
import { EsignFormRef } from '../../state/models/esign/esign-form-ref.model';
import { buildEsignMessaging } from '../../state/models/esign/esign-messaging.builder';
import { buildFormsIncludedMap } from '../../state/models/esign/forms-included.builder';
import { buildEnvelopeSignRequest } from '../../state/models/esign/envelope-sign.builder';
import { SIGN_ENVELOPE_FAIL, SIGN_ENVELOPE_SUCCESS, TrySignEnvelope } from '../../state/actions/sign-envelope.actions';
import { SignersController } from './signers.controller';
import { SignerFieldChange } from './signers-table.component';
import { ESIGN_TOOLTIPS } from './esign-tooltips';

// Input model injected via the modal's initialState. `formValues` is a snapshot of the current form
// values taken when the modal is opened (the forms are frozen while it is open); `customerId` seeds the
// envelope. Both feed the send flow.
export interface SendForSignatureModel {
  esignData: EsignData | null;
  formValues: FormValueInput[];
  customerId: string;
  packageId: string | number;
  // The launched forms (id + name), used for the default message body and the "Forms Included" cell.
  forms: EsignFormRef[];
}

// The "Send for Signature" modal shell. It orchestrates the send experience: it builds the signers
// controller from the e-sign baseline, renders the configuration controls and the signers table, and
// delegates every edit to the controller (which owns the state and the cascade logic). The signing
// state lives locally here (no NgRx). Sending is wired in a later step.
@Component({
  selector: 'send-for-signature',
  templateUrl: './send-for-signature.component.html',
  styleUrls: ['./send-for-signature.component.less']
})
export class SendForSignatureComponent extends BaseDialogComponent<SendForSignatureModel> implements SendForSignatureModel, OnInit, OnDestroy {

  esignData: EsignData | null = null;
  formValues: FormValueInput[] = [];
  customerId = '';
  packageId: string | number = '';
  forms: EsignFormRef[] = [];
  controller!: SignersController;

  // True while the send request is in flight — disables "Sign Now" to prevent a double submit.
  sending = false;

  // Shows/hides the FORMS INCLUDED column (visible by default, mirroring the reference). Purely
  // presentational — it does not affect the signers or the send.
  showFormsIncluded = true;

  // Per-signer form names, computed once from the baseline; drives the FORMS INCLUDED cell. Manually-added
  // recipients are absent from the map and resolve to an empty list.
  private formsIncludedMap = new Map<string, string[]>();
  private readonly destroyed$ = new Subject<void>();

  readonly sendTypeOptions = SEND_TYPE_OPTIONS;
  readonly idCheckOptions = ID_CHECK_OPTIONS;
  readonly tooltips = ESIGN_TOOLTIPS;

  // Signing groups are fetched from DocuSign into the store; the template consumes them via async pipes
  // so the subscriptions tear down with the modal.
  signingGroupOptions$!: Observable<SigningGroupOption[]>;
  signingGroupsLoading$!: Observable<boolean>;
  hasSigningGroups$!: Observable<boolean>;

  constructor(public modalRef: BsModalRef, private _store: Store<any>, private _actions: Actions) {
    super(modalRef);
  }

  ngOnInit(): void {
    const messaging = buildEsignMessaging(this.esignData, this.forms.map(form => form.formName));
    this.controller = new SignersController(
      buildDisplaySigners(this.esignData),
      this.esignData?.defaultIdentityCheckMethod,
      messaging
    );
    this.formsIncludedMap = buildFormsIncludedMap(this.controller.signers, this.esignData?.signData?.Fields, this.forms);

    this.signingGroupOptions$ = this._store.select(SigningGroupsSelectors.selectSigningGroupOptions);
    this.signingGroupsLoading$ = this._store.select(SigningGroupsSelectors.selectSigningGroupsLoading);
    this.hasSigningGroups$ = this._store.select(SigningGroupsSelectors.selectHasSigningGroups);

    // Only DocuSign exposes signing groups; the baseline SignSettings carry the account/environment.
    if (this.esignData?.vendor === 'Docusign') {
      this._store.dispatch(new TryLoadSigningGroups(buildSigningGroupsRequest(this.esignData.signSettings)));
    }

    // Close the modal once the envelope is sent; re-enable "Sign Now" if it fails (the effect shows the
    // success/error notification).
    this._actions.pipe(ofType(SIGN_ENVELOPE_SUCCESS), takeUntil(this.destroyed$)).subscribe(() => this.close());
    this._actions.pipe(ofType(SIGN_ENVELOPE_FAIL), takeUntil(this.destroyed$)).subscribe(() => (this.sending = false));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  get isEmpty(): boolean {
    return this.controller.signers.length === 0;
  }

  // Stable, bound validity query handed to the table so it can flag invalid fields without owning the
  // validation rules. An arrow field keeps the reference identity stable across change detection.
  readonly isFieldInvalid = (signer: DisplaySigner, field: string): boolean =>
    this.controller?.isFieldInvalid(signer, field as 'name' | 'email' | 'order' | 'sendType' | 'phone') ?? false;

  // Stable, bound duplicate query handed to the table so it can flag signers that share an identity
  // (same name + email) without owning the detection logic. Arrow field to keep the reference stable.
  readonly isDuplicate = (signer: DisplaySigner): boolean =>
    this.controller?.isDuplicate(signer) ?? false;

  // Stable, bound query handed to the table so the signing-group cell can disable itself when the row
  // carries a name/email, without owning the mutual-exclusion rule. Arrow field keeps the reference stable.
  readonly isSigningGroupDisabled = (signer: DisplaySigner): boolean =>
    this.controller?.isSigningGroupDisabled(signer) ?? false;

  // Stable, bound query handed to the table so the name/email inputs disable themselves once a signing
  // group is set, without owning the mutual-exclusion rule. Arrow field keeps the reference stable.
  readonly isNameEmailDisabled = (signer: DisplaySigner): boolean =>
    this.controller?.isNameEmailDisabled(signer) ?? false;

  // Stable, bound lookup handed to the table for the FORMS INCLUDED cell: the names of the forms a signer
  // signs. Precomputed from the baseline; manually-added recipients resolve to an empty list.
  readonly formNamesFor = (signer: DisplaySigner): string[] =>
    this.formsIncludedMap.get(signer.key) ?? [];

  toggleFormsIncluded(): void { this.showFormsIncluded = !this.showFormsIncluded; }

  // ── Global configuration ──────────────────────────────────────────────
  onGlobalSendTypeChange(value: DocusignSendType): void { this.controller.setGlobalSendType(value); }
  onGlobalIdCheckChange(value: string): void { this.controller.setGlobalIdCheck(value); }
  onGlobalSigningGroupChange(value: string): void { this.controller.setGlobalSigningGroup(value); }
  toggleGlobalConfiguration(): void { this.controller.toggleGlobalConfiguration(); }

  // ── Recipients / unassigned roles ─────────────────────────────────────
  onAddRecipient(): void { this.controller.addRecipient(); }
  onRemoveRecipient(signer: DisplaySigner): void { this.controller.removeRecipient(signer); }
  toggleUnassignedRoles(): void { this.controller.toggleUnassignedRoles(); }

  // ── Signing order ─────────────────────────────────────────────────────
  toggleSigningOrder(): void { this.controller.toggleSigningOrder(); }
  onOrderChange(change: SignerFieldChange<number>): void { this.controller.updateOrder(change.signer, change.value); }
  onMoveUp(signer: DisplaySigner): void { this.controller.moveUp(signer); }
  onMoveDown(signer: DisplaySigner): void { this.controller.moveDown(signer); }

  // ── Per-signer edits (delegated from the table) ───────────────────────
  onNameChange(change: SignerFieldChange): void { this.controller.updateName(change.signer, change.value); }
  onEmailChange(change: SignerFieldChange): void { this.controller.updateEmail(change.signer, change.value); }
  onSendTypeChange(change: SignerFieldChange<DocusignSendType>): void { this.controller.updateSendType(change.signer, change.value); }
  onIdCheckChange(change: SignerFieldChange): void { this.controller.updateIdCheck(change.signer, change.value); }
  onPhoneChange(change: SignerFieldChange): void { this.controller.updatePhone(change.signer, change.value); }
  onSigningGroupChange(change: SignerFieldChange): void { this.controller.updateSigningGroup(change.signer, change.value); }

  // Validates the signers, then assembles the DocuSign envelope from the baseline + the modal's
  // recipients/messaging, with the PrintData field values refreshed from the current form snapshot, and
  // dispatches the send. On success the modal closes; on failure it re-enables and shows an error.
  signNow(): void {
    if (this.isEmpty || this.sending || !this.esignData || !this.controller.validate()) { return; }

    const request = buildEnvelopeSignRequest({
      esignData: this.esignData,
      signers: this.controller.signers,
      messageSubject: this.controller.messageSubject,
      messageBody: this.controller.messageBody,
      customerId: this.customerId,
      packageId: this.packageId,
      formValues: this.formValues
    });

    this.sending = true;
    this._store.dispatch(new TrySignEnvelope(request));
  }
}
