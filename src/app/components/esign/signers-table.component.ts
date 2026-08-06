import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DisplaySigner } from '../../state/models/esign/display-signer.model';
import { SEND_TYPE_OPTIONS, DocusignSendType } from '../../state/models/esign/esign-send-type.model';
import { ID_CHECK_OPTIONS, isPhoneBasedIdCheck } from '../../state/models/esign/esign-auth-type.model';
import { SigningGroupOption } from '../../state/models/esign/signing-group-option.model';
import { ESIGN_TOOLTIPS } from './esign-tooltips';

// A single field edit emitted by a row: which signer changed and the new value.
export interface SignerFieldChange<T = string> {
  signer: DisplaySigner;
  value: T;
}

// The signers grid: renders one row per signer plus the roles it signs. It is presentational — it binds
// values one-way and emits an event on each edit; the owning modal delegates those to the controller,
// which holds the state and the cascade/validation logic. The per-signer SEND TYPE / ID CHECK columns
// are hidden in global-configuration mode, where those values are set once for everyone.
@Component({
  selector: 'fs-signers-table',
  templateUrl: './signers-table.component.html',
  styleUrls: ['./signers-table.component.less']
})
export class SignersTableComponent {
  @Input() signers: DisplaySigner[] = [];
  @Input() useGlobalConfiguration = true;
  @Input() useSigningOrder = false;

  // Injected predicate that tells the row whether a field should show an error. The validity rules
  // live in the controller; the table only reflects the answer, staying free of domain logic.
  @Input() fieldValidator: (signer: DisplaySigner, field: string) => boolean = () => false;

  // Injected predicate that tells the row whether a signer shares its identity (name + email) with
  // another. Duplicate detection lives in the controller; the table only surfaces the indicator.
  @Input() duplicateSigner: (signer: DisplaySigner) => boolean = () => false;

  // Injected predicate that disables the name/email inputs when the row carries a signing group
  // (mutual exclusion, owned by the controller). The table only reflects the answer.
  @Input() nameEmailDisabled: (signer: DisplaySigner) => boolean = () => false;

  // Signing-group inputs: the fetched options, the loading flag, whether any real group exists, and a
  // predicate that disables the cell when the row carries a name/email (mutual exclusion, owned by the
  // controller). The column is shown only in per-signer mode.
  @Input() signingGroupOptions: SigningGroupOption[] = [];
  @Input() signingGroupsLoading = false;
  @Input() hasSigningGroups = false;
  @Input() signingGroupDisabled: (signer: DisplaySigner) => boolean = () => false;

  // Whether the FORMS INCLUDED column is shown (toggled from the modal). Injected predicate returns the
  // names of the forms a signer signs; the count and tooltip are derived from it. The computation lives
  // outside the table (it needs the baseline), keeping the table presentational.
  @Input() showFormsIncludedColumn = true;
  @Input() formsIncluded: (signer: DisplaySigner) => string[] = () => [];

  @Output() nameChange = new EventEmitter<SignerFieldChange>();
  @Output() emailChange = new EventEmitter<SignerFieldChange>();
  @Output() sendTypeChange = new EventEmitter<SignerFieldChange<DocusignSendType>>();
  @Output() idCheckChange = new EventEmitter<SignerFieldChange>();
  @Output() phoneChange = new EventEmitter<SignerFieldChange>();
  @Output() orderChange = new EventEmitter<SignerFieldChange<number>>();
  @Output() signingGroupChange = new EventEmitter<SignerFieldChange>();
  @Output() moveUp = new EventEmitter<DisplaySigner>();
  @Output() moveDown = new EventEmitter<DisplaySigner>();
  @Output() removeRecipient = new EventEmitter<DisplaySigner>();

  // Whether any row can be removed — used to render the ACTIONS column only when a manually-added
  // recipient is present, so the baseline-only case keeps the table unchanged.
  get hasRemovableRows(): boolean {
    return this.signers.some(signer => signer.isManuallyAdded);
  }

  readonly sendTypeOptions = SEND_TYPE_OPTIONS;
  readonly idCheckOptions = ID_CHECK_OPTIONS;
  readonly tooltips = ESIGN_TOOLTIPS;

  // The PHONE column is shown only when some signer uses a phone-based identity check.
  get showPhoneColumn(): boolean {
    return this.signers.some(signer => this.isPhoneCheck(signer.idCheck));
  }

  isPhoneCheck(idCheck: string): boolean {
    return isPhoneBasedIdCheck(idCheck);
  }

  // The comma-separated role labels a signer holds (single package).
  formattedRoles(signer: DisplaySigner): string {
    return signer.signingRoles.map(role => role.role).filter(Boolean).join(', ');
  }

  // The form names shown in the FORMS INCLUDED tooltip, one bulleted name per line. The line breaks are
  // preserved by the `fs-tooltip-multiline` container style (tooltips mount outside the scoped styles).
  // Takes the names captured once in the template so `formsIncluded` is not re-invoked per binding.
  formsIncludedTooltip(forms: string[]): string {
    return forms.map(name => `• ${name}`).join('\n');
  }

  trackBySigner(_index: number, signer: DisplaySigner): string {
    return signer.key;
  }
}
