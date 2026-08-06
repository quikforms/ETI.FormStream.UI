import { DisplaySigner } from './display-signer.model';
import { EsignFormRef } from './esign-form-ref.model';

// The tab arrays produced in the e-sign baseline (esignData.signData.Fields). Each tab places a field on
// one form for one role, so they tell us which forms a signer's roles actually sign.
const TAB_ARRAY_KEYS = [
  'SignHereTabs', 'SignInitialTabs', 'SignDateTabs', 'TextTabs', 'CheckboxTabs', 'RadioGroupTabs'
];

// Builds a per-signer map of the form names the signer signs, keyed by signer key. Computed once from the
// immutable baseline; manually-added recipients (not in the baseline) simply resolve to an empty list.
export function buildFormsIncludedMap(
  signers: DisplaySigner[],
  fields: unknown,
  forms: EsignFormRef[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  signers.forEach(signer => map.set(signer.key, collectSignerFormNames(signer, fields, forms)));
  return map;
}

// The names of the launched forms a signer signs: the forms where at least one of the signer's roles has
// a tab in the baseline. Pure, single-package. Mirrors the reference resolution — match the signer's role
// ids against the tabs' RoleID/Role and scope to the forms those tabs sit on; when the tabs cannot be
// scoped to the roles (no tab metadata, or no match), fall back to all forms so a signer with roles is
// never shown as signing nothing.
export function collectSignerFormNames(
  signer: DisplaySigner,
  fields: unknown,
  forms: EsignFormRef[]
): string[] {
  const roleKeys = collectRoleKeys(signer);
  if (roleKeys.size === 0) { return []; }

  const tabs = collectTabs(fields);
  const matchedFormIds = tabs.length ? formIdsForRoles(tabs, roleKeys) : null;
  const useRoleScoped = matchedFormIds !== null && matchedFormIds.size > 0;

  const names: string[] = [];
  const seen = new Set<string>();
  for (const form of forms) {
    if (useRoleScoped && !formIdMatches(form.formId, matchedFormIds!)) { continue; }
    const name = (form.formName || '').trim();
    if (name && !seen.has(form.formId)) {
      seen.add(form.formId);
      names.push(name);
    }
  }
  return names;
}

// The role identifiers a signer carries (roleID and role), lowercased. Matched against the tabs.
function collectRoleKeys(signer: DisplaySigner): Set<string> {
  const keys = new Set<string>();
  (signer.signingRoles ?? []).forEach(role => {
    addKey(keys, role.roleID);
    addKey(keys, role.role);
  });
  return keys;
}

function addKey(keys: Set<string>, value: string | undefined | null): void {
  const key = (value ?? '').trim().toLowerCase();
  if (key) { keys.add(key); }
}

// Flattens the six tab arrays of the baseline Fields object into a single list.
function collectTabs(fields: unknown): any[] {
  const source = fields as Record<string, unknown> | null | undefined;
  if (!source) { return []; }
  return TAB_ARRAY_KEYS.flatMap(key => Array.isArray(source[key]) ? source[key] as any[] : []);
}

// The FormIDs of the tabs whose role matches one of the signer's role keys (raw and normalized).
function formIdsForRoles(tabs: any[], roleKeys: Set<string>): Set<string> {
  const formIds = new Set<string>();
  for (const tab of tabs) {
    const formId = (tab?.FormID ?? '').toString().trim();
    if (!formId) { continue; }
    const role = (tab?.Role ?? '').toString().trim().toLowerCase();
    const roleId = (tab?.RoleID ?? '').toString().trim().toLowerCase();
    if ((role && roleKeys.has(role)) || (roleId && roleKeys.has(roleId))) {
      formIds.add(formId);
      formIds.add(normalizeFormId(formId));
    }
  }
  return formIds;
}

// Whether a form's id matches the tab form-id set, comparing raw and normalized forms of both.
function formIdMatches(formId: string, tabFormIds: Set<string>): boolean {
  const raw = (formId ?? '').toString().trim();
  const normalized = normalizeFormId(formId);
  if (!normalized) { return false; }
  if (tabFormIds.has(raw) || tabFormIds.has(normalized)) { return true; }
  for (const id of tabFormIds) {
    if (normalizeFormId(id) === normalized) { return true; }
  }
  return false;
}

// Aligns with the QFE Docusign.js form-id normalization: keep the leading segment before a comma, dash,
// or dot (form instances / composite ids collapse to their base form id).
function normalizeFormId(formId: string): string {
  let id = (formId ?? '').toString().trim();
  if (!id) { return ''; }
  [',', '-', '.'].forEach(separator => {
    if (id.includes(separator)) { id = id.split(separator)[0].trim(); }
  });
  return id;
}
