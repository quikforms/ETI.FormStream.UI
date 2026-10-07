import {
  buildIdCheckOptions,
  DocusignAuthType,
  ID_CHECK_OPTIONS,
  isPhoneBasedIdCheck,
  normalizeIdCheck,
  PASSCODE_VIA_SMS_VOICE,
  toDocusignIdentityCheckValue
} from './esign-auth-type.model';

describe('buildIdCheckOptions', () => {
  it('offers the standard options when the account does not support phone authentication', () => {
    expect(buildIdCheckOptions(false).map(option => option.name))
      .toEqual(['No Identity Check', 'ID Check', 'SMS', 'Phone']);
  });

  it('offers Passcode via SMS/Voice right after Phone when the account supports it', () => {
    expect(buildIdCheckOptions(true).map(option => option.name))
      .toEqual(['No Identity Check', 'ID Check', 'SMS', 'Phone', 'Passcode via SMS/Voice']);
    expect(buildIdCheckOptions(true)[4].keyName).toBe(PASSCODE_VIA_SMS_VOICE);
  });

  it('never adds the option to the standard list', () => {
    buildIdCheckOptions(true);
    buildIdCheckOptions(true);

    expect(ID_CHECK_OPTIONS).toHaveLength(4);
    expect(buildIdCheckOptions(false)).not.toBe(ID_CHECK_OPTIONS);
  });
});

describe('isPhoneBasedIdCheck', () => {
  it.each([
    [DocusignAuthType.SMS.toString(), true],
    [DocusignAuthType.Phone.toString(), true],
    [PASSCODE_VIA_SMS_VOICE, true],
    [DocusignAuthType.NoIDCheck.toString(), false],
    [DocusignAuthType.IDCheck.toString(), false]
  ])('%s → %s', (idCheck, expected) => {
    expect(isPhoneBasedIdCheck(idCheck)).toBe(expected);
  });
});

describe('toDocusignIdentityCheckValue', () => {
  it('sends Passcode via SMS/Voice as SMS', () => {
    expect(toDocusignIdentityCheckValue(PASSCODE_VIA_SMS_VOICE)).toBe(DocusignAuthType.SMS);
  });

  it('keeps the standard options as their codes', () => {
    expect(['0', '1', '2', '3'].map(toDocusignIdentityCheckValue)).toEqual([0, 1, 2, 3]);
  });

  it('sends an unrecognized value as No Identity Check', () => {
    expect(toDocusignIdentityCheckValue('unknown')).toBe(DocusignAuthType.NoIDCheck);
  });
});

describe('normalizeIdCheck', () => {
  it('does not accept Passcode via SMS/Voice as a default', () => {
    expect(normalizeIdCheck('Passcode via SMS/Voice')).toBe('0');
    expect(normalizeIdCheck(PASSCODE_VIA_SMS_VOICE)).toBe('0');
  });

  it('still accepts the standard options by code or name', () => {
    expect(normalizeIdCheck('3')).toBe('3');
    expect(normalizeIdCheck('sms')).toBe('2');
  });
});
