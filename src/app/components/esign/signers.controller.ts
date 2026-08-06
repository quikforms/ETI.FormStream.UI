import { DisplaySigner } from '../../state/models/esign/display-signer.model';
import { ESignSigner } from '../../state/models/esign/esign-signer.model';
import { DocusignSendType } from '../../state/models/esign/esign-send-type.model';
import { DocusignAuthType, isPhoneBasedIdCheck, normalizeIdCheck } from '../../state/models/esign/esign-auth-type.model';
import { EsignMessaging } from '../../state/models/esign/esign-messaging.builder';

// A pragmatic email check (a stricter address grammar is not warranted here). Phone validity only
// requires enough digits to be a plausible number, since the element has no phone-parsing library.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Owns the signers grid state and every operation on it (per-signer edits and their cascades, the
// configuration mode, signing order, and validation). Plain class — no Angular — so the logic is
// isolated from the view and easy to reason about and test. The owning modal creates one instance from
// the baseline; the presentational table drives it through the modal's thin handlers.
//
// A DisplaySigner is a person; the values the user edits on the row are mirrored onto that person's
// signing roles, which is what the send flow ultimately consumes.
export class SignersController {

  // Configuration mode. Global (default) applies one send type / id check to every signer; per-signer
  // lets each row differ.
  useGlobalConfiguration = true;
  globalSendType: DocusignSendType = DocusignSendType.EmailToSign;
  globalIdCheck: string = DocusignAuthType.NoIDCheck.toString();
  globalSigningGroup = '';

  // Signing order. Off (default) = everyone signs in parallel; on = a sequential order applies.
  useSigningOrder = false;

  // Unassigned roles. Off (default) = baseline signers with no name/email are hidden; on = they show.
  showUnassignedRoles = false;

  // Turns on inline field errors once the user has attempted to send; until then nothing is flagged.
  showValidationErrors = false;

  // Envelope messaging. Carried into the request by the send flow; edited directly from the modal.
  // Seeded from the launch baseline (or defaults) via the constructor; the fields below are only the
  // fallback used when no seed is supplied.
  messageSubject = 'Please e-sign these forms';
  messageBody = '';

  constructor(public signers: DisplaySigner[] = [], defaultIdCheck?: string, messaging?: EsignMessaging) {
    // Seed the global ID Check from the customer's admin default (normalized to a known auth-type code,
    // else "No Identity Check"); starting in global mode then applies it to every signer.
    this.globalIdCheck = normalizeIdCheck(defaultIdCheck);
    if (messaging) {
      this.messageSubject = messaging.subject;
      this.messageBody = messaging.body;
    }
    this.applyGlobalConfig();
  }

  // ── Global configuration ────────────────────────────────────────────────
  // Global mode hides the per-signer SEND TYPE / ID CHECK columns and applies one value to everyone.

  toggleGlobalConfiguration(): void {
    this.useGlobalConfiguration = !this.useGlobalConfiguration;
    if (this.useGlobalConfiguration) { this.applyGlobalConfig(); }
  }

  setGlobalSendType(value: DocusignSendType): void {
    this.globalSendType = value;
    this.applyGlobalConfig();
  }

  setGlobalIdCheck(value: string): void {
    this.globalIdCheck = value;
    this.applyGlobalConfig();
  }

  // Applies one signing group to every signer. Kept out of applyGlobalConfig so that changing the send
  // type / id check never wipes names via the group's mutual exclusion — the group is only (re)applied
  // when the user picks it here.
  setGlobalSigningGroup(value: string): void {
    this.globalSigningGroup = value;
    this.signers.forEach(signer => this.updateSigningGroup(signer, value));
  }

  private applyGlobalConfig(): void {
    this.signers.forEach(signer => {
      this.updateSendType(signer, this.globalSendType);
      this.updateIdCheck(signer, this.globalIdCheck);
    });
  }

  // ── Per-signer edits ────────────────────────────────────────────────────

  updateSendType(signer: DisplaySigner, value: DocusignSendType): void {
    signer.sendType = value;
    signer.signingRoles.forEach(role => (role.sendType = value));
  }

  updateIdCheck(signer: DisplaySigner, value: string): void {
    signer.idCheck = value;
    signer.signingRoles.forEach(role => (role.idCheck = value));
    // A non-phone check has no phone: clear it so a now-hidden, stale number is never carried or sent.
    if (!isPhoneBasedIdCheck(value)) {
      this.setPhone(signer, '');
    }
  }

  updateName(signer: DisplaySigner, value: string): void {
    signer.name = value;
    this.syncPersonToRoles(signer);
  }

  updateEmail(signer: DisplaySigner, value: string): void {
    signer.mail = value;
    this.syncPersonToRoles(signer);
  }

  updatePhone(signer: DisplaySigner, value: string): void {
    this.setPhone(signer, value);
  }

  updateOrder(signer: DisplaySigner, value: number): void {
    if (!Number.isInteger(value) || value < 1) { return; }
    // Duplicates (same name + email) always share one order, so move the whole identity group together.
    this.identityGroup(signer).forEach(member => this.setOrder(member, value));
  }

  // Selecting a signing group replaces a named recipient: mirror it onto the roles and clear name/email
  // (mutually exclusive). Clearing the group (empty value) leaves name/email untouched.
  updateSigningGroup(signer: DisplaySigner, value: string): void {
    const group = value || undefined;
    signer.signingGroup = group;
    signer.signingRoles.forEach(role => (role.signingGroup = group));
    if (group) {
      this.clearContact(signer);
    }
  }

  // ── Recipients ────────────────────────────────────────────────────────

  // Adds an empty, manually-added signer for a recipient not present in the baseline. It carries a
  // single blank role and takes the current global send type / id check so it fits either mode.
  addRecipient(): void {
    const order = this.useSigningOrder ? this.getNextOrderNumber() : 1;
    const role: ESignSigner = {
      order,
      name: '',
      mail: '',
      phone: '',
      sendType: this.globalSendType,
      idCheck: this.globalIdCheck,
      role: '',
      roleID: '',
      signingGroup: undefined
    };
    this.signers.push({
      key: crypto.randomUUID(),
      order,
      name: '',
      mail: '',
      phone: '',
      sendType: this.globalSendType,
      idCheck: this.globalIdCheck,
      signingGroup: undefined,
      signingRoles: [role],
      isManuallyAdded: true
    });
  }

  // Removes a manually-added signer. Baseline signers are never removed (they belong to the package).
  removeRecipient(signer: DisplaySigner): void {
    if (!signer.isManuallyAdded) { return; }
    const index = this.signers.findIndex(other => other.key === signer.key);
    if (index > -1) {
      this.signers.splice(index, 1);
      // Renumber so the removal never leaves a gap in the signing order (e.g. 1, 3 → 1, 2).
      if (this.useSigningOrder) { this.normalizeSigningOrders(); }
    }
  }

  private getNextOrderNumber(): number {
    return this.signers.length ? Math.max(...this.signers.map(signer => signer.order)) + 1 : 1;
  }

  // ── Unassigned roles ──────────────────────────────────────────────────

  // The signers to render: baseline roles nobody is assigned to are hidden unless the toggle is on.
  get visibleSigners(): DisplaySigner[] {
    return this.showUnassignedRoles
      ? this.sortedSigners
      : this.sortedSigners.filter(signer => !this.isUnassigned(signer));
  }

  toggleUnassignedRoles(): void {
    this.showUnassignedRoles = !this.showUnassignedRoles;
  }

  // A baseline signer with no person and no signing group — a role nobody has been assigned to yet.
  // Manually-added signers are never unassigned (the user just created them to fill in).
  isUnassigned(signer: DisplaySigner): boolean {
    return !signer.isManuallyAdded
      && !signer.name.trim()
      && !signer.mail.trim()
      && !signer.signingGroup;
  }

  get unassignedRolesCount(): number {
    return this.signers
      .filter(signer => this.isUnassigned(signer))
      .reduce((count, signer) => count + signer.signingRoles.length, 0);
  }

  // ── Signing order ─────────────────────────────────────────────────────

  // The signers in the order they should appear: by signing order when it is enabled, otherwise as-is.
  get sortedSigners(): DisplaySigner[] {
    return this.useSigningOrder
      ? [...this.signers].sort((a, b) => a.order - b.order)
      : this.signers;
  }

  toggleSigningOrder(): void {
    this.useSigningOrder = !this.useSigningOrder;
    if (this.useSigningOrder) {
      this.reassignSigningOrders();
    } else {
      // Parallel signing: everyone signs at once.
      this.signers.forEach(signer => this.setOrder(signer, 1));
    }
  }

  // Swaps a signer's order with the one above it in the sorted view (moving it earlier in the sequence).
  moveUp(signer: DisplaySigner): void {
    this.swapOrderWithNeighbor(signer, -1);
  }

  moveDown(signer: DisplaySigner): void {
    this.swapOrderWithNeighbor(signer, 1);
  }

  private swapOrderWithNeighbor(signer: DisplaySigner, direction: 1 | -1): void {
    // Moves operate on distinct orders (a duplicate group shares one), so a whole group swaps places
    // with the neighbouring group rather than a single row leaking out of its group.
    const distinctOrders = [...new Set(this.signers.map(other => other.order))].sort((a, b) => a - b);
    const currentOrder = signer.order;
    const neighborOrder = distinctOrders[distinctOrders.indexOf(currentOrder) + direction];
    if (neighborOrder === undefined) { return; }
    this.signers.forEach(other => {
      if (other.order === currentOrder) { this.setOrder(other, neighborOrder); }
      else if (other.order === neighborOrder) { this.setOrder(other, currentOrder); }
    });
  }

  // Collapses any gaps in the signing order into a contiguous 1..N sequence, preserving the current
  // relative order and keeping duplicate groups (same order) together. Used after a removal so deleting a
  // reordered recipient never leaves a hole (e.g. 1, 3 → 1, 2).
  private normalizeSigningOrders(): void {
    const distinctOrders = [...new Set(this.signers.map(signer => signer.order))].sort((a, b) => a - b);
    const rankByOrder = new Map<number, number>();
    distinctOrders.forEach((order, index) => rankByOrder.set(order, index + 1));
    this.signers.forEach(signer => this.setOrder(signer, rankByOrder.get(signer.order)!));
  }

  // Assigns sequential orders (1, 2, 3 …) to each distinct person; duplicates share the same order.
  private reassignSigningOrders(): void {
    let order = 1;
    const processed = new Set<string>();
    for (const signer of this.signers) {
      if (processed.has(signer.key)) { continue; }
      this.identityGroup(signer).forEach(member => {
        this.setOrder(member, order);
        processed.add(member.key);
      });
      order++;
    }
  }

  // The signers that share this signer's identity (same non-empty name and email), including itself.
  // Unassigned signers (no name or email) are their own group.
  private identityGroup(signer: DisplaySigner): DisplaySigner[] {
    const name = signer.name.trim().toLowerCase();
    const mail = signer.mail.trim().toLowerCase();
    if (!name || !mail) { return [signer]; }
    return this.signers.filter(other => this.sameIdentity(other, name, mail));
  }

  // The signing group and a named recipient are mutually exclusive, so the group is disabled while the
  // row still carries a name or email.
  isSigningGroupDisabled(signer: DisplaySigner): boolean {
    return !!(signer.name.trim() || signer.mail.trim());
  }

  // The other side of the same mutual exclusion: once a signing group is set, name and email are
  // disabled so the row cannot carry both a named recipient and a group.
  isNameEmailDisabled(signer: DisplaySigner): boolean {
    return !!signer.signingGroup?.trim();
  }

  // A signer duplicates another when they share the same (non-empty) name and email.
  isDuplicate(signer: DisplaySigner): boolean {
    const name = signer.name.trim().toLowerCase();
    const mail = signer.mail.trim().toLowerCase();
    if (!name || !mail) { return false; }
    return this.signers.some(other => other.key !== signer.key && this.sameIdentity(other, name, mail));
  }

  // ── Validation ────────────────────────────────────────────────────────

  // Turns on error display and reports whether every signer is valid. Called before sending.
  validate(): boolean {
    this.showValidationErrors = true;
    const signersValid = this.signers.every(signer =>
      !this.isFieldInvalid(signer, 'name') &&
      !this.isFieldInvalid(signer, 'email') &&
      !this.isFieldInvalid(signer, 'order') &&
      !this.isFieldInvalid(signer, 'sendType') &&
      !this.isFieldInvalid(signer, 'phone'));
    return signersValid && !this.isGlobalSendTypeInvalid() && this.hasSendableRecipient();
  }

  // The envelope needs at least one real recipient: a signer with both a name and email, or a signing
  // group. Unassigned baseline roles are skipped by isFieldInvalid, so without this an all-unassigned
  // baseline would pass validation and enable the send with nobody to send to.
  private hasSendableRecipient(): boolean {
    return this.signers.some(signer =>
      (signer.name.trim() !== '' && signer.mail.trim() !== '') ||
      (!!signer.signingGroup && signer.signingGroup.trim() !== ''));
  }

  // In global mode a real send type must be chosen for everyone (None is the blank option). Per-signer
  // mode validates each row's send type instead (see the 'sendType' branch below).
  isGlobalSendTypeInvalid(): boolean {
    return this.showValidationErrors
      && this.useGlobalConfiguration
      && this.globalSendType === DocusignSendType.None;
  }

  isFieldInvalid(signer: DisplaySigner, field: 'name' | 'email' | 'order' | 'sendType' | 'phone'): boolean {
    if (!this.showValidationErrors) { return false; }

    // Unassigned baseline roles (nobody assigned, hidden by default) are not sent to, so they never
    // block the send or show inline errors — even when the advisor reveals them.
    if (this.isUnassigned(signer)) { return false; }

    if (field === 'order') {
      return this.useSigningOrder && (!Number.isInteger(signer.order) || signer.order < 1);
    }

    // Per-signer mode: every row must pick a real send type (None is the blank option). Global mode
    // validates the single global send type instead.
    if (field === 'sendType') {
      return !this.useGlobalConfiguration && signer.sendType === DocusignSendType.None;
    }

    // A phone number is required and must be plausible only when the signer uses a phone-based check.
    if (field === 'phone') {
      return isPhoneBasedIdCheck(signer.idCheck) && !this.isValidPhone(signer.phone);
    }

    // Name and email are required only for a signer that will actually be sent to (a real send type).
    if (!this.requiresContact(signer)) { return false; }
    const value = field === 'name' ? signer.name : signer.mail;
    if (!value.trim()) { return true; }
    // A present email must also be well-formed.
    return field === 'email' && !EMAIL_PATTERN.test(signer.mail.trim());
  }

  private isValidPhone(phone: string): boolean {
    return (phone ?? '').replace(/\D/g, '').length >= 7;
  }

  // Name/email are required for a signer that will be sent to, unless a signing group stands in for the
  // named recipient (mutually exclusive with name/email).
  private requiresContact(signer: DisplaySigner): boolean {
    return signer.sendType !== DocusignSendType.None && !signer.signingGroup;
  }

  // Name/email identify the person: mirror them onto the roles and drop any signing group (mutually
  // exclusive with a named signer). When ordering is on, matching duplicates share the same order.
  private syncPersonToRoles(signer: DisplaySigner): void {
    signer.signingGroup = undefined;
    signer.signingRoles.forEach(role => {
      role.name = signer.name;
      role.mail = signer.mail;
      role.signingGroup = undefined;
    });
    if (this.useSigningOrder && signer.name.trim() && signer.mail.trim()) {
      this.matchDuplicateOrder(signer);
    }
  }

  private matchDuplicateOrder(signer: DisplaySigner): void {
    const name = signer.name.trim().toLowerCase();
    const mail = signer.mail.trim().toLowerCase();
    const twin = this.signers.find(other => other.key !== signer.key && this.sameIdentity(other, name, mail));
    if (twin) { this.setOrder(signer, twin.order); }
  }

  private sameIdentity(signer: DisplaySigner, name: string, mail: string): boolean {
    return signer.name.trim().toLowerCase() === name && signer.mail.trim().toLowerCase() === mail;
  }

  private clearContact(signer: DisplaySigner): void {
    signer.name = '';
    signer.mail = '';
    signer.signingRoles.forEach(role => { role.name = ''; role.mail = ''; });
  }

  private setPhone(signer: DisplaySigner, value: string): void {
    signer.phone = value;
    signer.signingRoles.forEach(role => (role.phone = value));
  }

  private setOrder(signer: DisplaySigner, value: number): void {
    signer.order = value;
    signer.signingRoles.forEach(role => (role.order = value));
  }
}
