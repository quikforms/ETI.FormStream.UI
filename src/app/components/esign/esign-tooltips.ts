// Single source of truth for the Send-for-Signature help-tooltip copy. Several of these strings appear
// in more than one place (the global "Required Configuration" labels and the per-signer table headers),
// so they live here to stay in sync and to match the reference wording exactly.
export const ESIGN_TOOLTIPS = {
  duplicateRoles:
    'Some signer roles may be duplicated across forms or packages. These are automatically numbered ' +
    '(e.g., "Owner 1", "Owner 1-1") to match the document setup.',
  sendType:
    "IMPORTANT! Recipients marked as 'editor' must provide emails that belong to a Docusign account.",
  idCheck:
    'IMPORTANT! The selected Identity Check options must be enabled in the Docusign Authenticating ' +
    'Account for this e-sign transaction.',
  signingGroup:
    'When a signing group is selected, the name and email fields will be automatically disabled as ' +
    'they are managed by the signing group.',
  order: 'Use arrow buttons to reorder or manually enter numbers. Lower numbers sign first.',
  phone:
    'Accepts US numbers (e.g. 2025550191) and international numbers with a leading + ' +
    '(e.g. +52 1 512 744 796).'
} as const;
