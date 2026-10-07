import { EsignData } from '../Response/esign-data.model';
import { recipient, signersFrom } from './testing/signer.fixtures';
import { buildEnvelopeSignRequest, buildRecipients, hasInternationalPhone } from './envelope-sign.builder';
import { DisplaySigner } from './display-signer.model';
import { PASSCODE_VIA_SMS_VOICE } from './esign-auth-type.model';

const withCheck = (signers: DisplaySigner[], idCheck: string, phone: string): DisplaySigner[] => {
  signers.forEach(signer => signer.signingRoles.forEach(role => { role.idCheck = idCheck; role.phone = phone; }));
  return signers;
};

describe('buildRecipients', () => {
  it('sends Passcode via SMS/Voice as SMS with the phone split into number and country code', () => {
    const [sent] = buildRecipients(withCheck(signersFrom(recipient('Jane Doe')), PASSCODE_VIA_SMS_VOICE, '(202) 555-0191'));

    expect(sent.IdentityCheck).toBe(2);
    expect(sent.PhoneNumber).toBe('2025550191');
    expect(sent.PhoneNumberCountryCode).toBe('1');
  });

  it('sends the ID Check only as its code, never as the modal key', () => {
    const [sent] = buildRecipients(withCheck(signersFrom(recipient('Jane Doe')), PASSCODE_VIA_SMS_VOICE, '(202) 555-0191'));

    expect(sent).not.toHaveProperty('idCheck');
    expect(Object.values(sent)).not.toContain(PASSCODE_VIA_SMS_VOICE);
  });

  it('keeps the country code of an international number', () => {
    const [sent] = buildRecipients(withCheck(signersFrom(recipient('Jane Doe')), '2', '+44 20 7946 0958'));

    expect(sent.PhoneNumber).toBe('2079460958');
    expect(sent.PhoneNumberCountryCode).toBe('44');
  });

  it('sends empty phone fields when the number is not usable', () => {
    const [sent] = buildRecipients(withCheck(signersFrom(recipient('Jane Doe')), '3', '1234567'));

    expect(sent.PhoneNumber).toBe('');
    expect(sent.PhoneNumberCountryCode).toBe('');
  });

  it('sends no phone at all with a check that is not phone-based, even if the signer holds one', () => {
    const [sent] = buildRecipients(withCheck(signersFrom(recipient('Jane Doe')), '1', '(202) 555-0191'));

    expect(sent.IdentityCheck).toBe(1);
    expect(sent).not.toHaveProperty('PhoneNumber');
    expect(sent).not.toHaveProperty('PhoneNumberCountryCode');
    expect(sent).not.toHaveProperty('phone');
  });

  it('keeps sending the standard checks as their codes', () => {
    const sent = ['0', '1', '2', '3'].map(idCheck =>
      buildRecipients(withCheck(signersFrom(recipient('Jane Doe')), idCheck, '2025550191'))[0].IdentityCheck);

    expect(sent).toEqual([0, 1, 2, 3]);
  });
});

describe('hasInternationalPhone', () => {
  it('is false when every phone sent is a US number', () => {
    expect(hasInternationalPhone([{ PhoneNumberCountryCode: '1' }, {}])).toBe(false);
  });

  it('is true when a phone sent is outside the US', () => {
    expect(hasInternationalPhone([{ PhoneNumberCountryCode: '1' }, { PhoneNumberCountryCode: '44' }])).toBe(true);
  });

  it('treats a number that shares +1 with the US, such as a Canadian one, like a US number', () => {
    const recipients = buildRecipients(withCheck(signersFrom(recipient('Jane Doe')), '2', '+1 416 555 0123'));

    expect(recipients[0].PhoneNumber).toBe('4165550123');
    expect(recipients[0].PhoneNumberCountryCode).toBe('1');
    expect(hasInternationalPhone(recipients)).toBe(false);
  });
});

describe('buildEnvelopeSignRequest', () => {
  const build = (signers: DisplaySigner[]) => buildEnvelopeSignRequest({
    esignData: new EsignData('Docusign', { Recipients: [] }, {}, {}),
    signers,
    messageSubject: 'Subject',
    messageBody: 'Body',
    customerId: '123',
    packageId: 1,
    formValues: []
  });

  it('asks for the international path when a phone-based recipient has a non-US number', () => {
    expect(build(withCheck(signersFrom(recipient('Jane Doe')), '2', '+44 20 7946 0958')).EnableInternationalPhoneNumber)
      .toBe(true);
  });

  it('does not ask for it for US numbers', () => {
    expect(build(withCheck(signersFrom(recipient('Jane Doe')), '2', '(202) 555-0191')).EnableInternationalPhoneNumber)
      .toBe(false);
  });

  it('ignores an international number held under a check that is not phone-based', () => {
    const signers = [
      ...withCheck(signersFrom(recipient('Jane Doe')), '2', '(202) 555-0191'),
      ...withCheck(signersFrom(recipient('John Roe')), '0', '+44 20 7946 0958')
    ];

    expect(build(signers).EnableInternationalPhoneNumber).toBe(false);
  });
});
