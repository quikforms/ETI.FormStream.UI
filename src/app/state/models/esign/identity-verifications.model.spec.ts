import { buildIdentityVerificationsRequest, hasPhoneAuthentication, identityVerificationsKey } from './identity-verifications.model';

describe('buildIdentityVerificationsRequest', () => {
  it('asks about the connection named in the sign settings', () => {
    expect(buildIdentityVerificationsRequest({ SignEnvironmentID: '2', AuthUserID: 'Test connection' }))
      .toEqual({ SignEnvironmentID: 2, AuthUserID: 'Test connection' });
  });

  it('passes the connection name on as it is', () => {
    expect(buildIdentityVerificationsRequest({ SignEnvironmentID: 2, AuthUserID: ' Test connection ' })?.AuthUserID)
      .toBe(' Test connection ');
  });

  it.each([
    [undefined],
    [null],
    [{}],
    [{ SignEnvironmentID: 2 }],
    [{ SignEnvironmentID: 2, AuthUserID: '   ' }],
    [{ SignEnvironmentID: 2, AuthUserID: 123 as any }],
    [{ SignEnvironmentID: '', AuthUserID: 'Test connection' }],
    [{ SignEnvironmentID: 'abc', AuthUserID: 'Test connection' }],
    [{ SignEnvironmentID: 0, AuthUserID: 'Test connection' }]
  ])('has nothing to ask when the settings are %p', signSettings => {
    expect(buildIdentityVerificationsRequest(signSettings as any)).toBeNull();
  });
});

describe('identityVerificationsKey', () => {
  it('tells apart connections and environments', () => {
    const keys = [
      { SignEnvironmentID: 2, AuthUserID: 'Connection A' },
      { SignEnvironmentID: 2, AuthUserID: 'Connection B' },
      { SignEnvironmentID: 1, AuthUserID: 'Connection A' }
    ].map(identityVerificationsKey);

    expect(new Set(keys).size).toBe(3);
  });

  it('is the same for the same connection', () => {
    expect(identityVerificationsKey({ SignEnvironmentID: 2, AuthUserID: 'Connection A' }))
      .toBe(identityVerificationsKey({ SignEnvironmentID: 2, AuthUserID: 'Connection A' }));
  });
});

describe('hasPhoneAuthentication', () => {
  it.each([
    [{ HasPhoneAuthenticationCapability: true }, true],
    [{ hasPhoneAuthenticationCapability: true }, true],
    [{ HasPhoneAuthenticationCapability: false }, false],
    [{}, false],
    ['', false],
    [null, false],
    [undefined, false]
  ])('%p → %s', (response, expected) => {
    expect(hasPhoneAuthentication(response)).toBe(expected);
  });
});
