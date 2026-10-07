import { recipient, signersFrom } from '../../state/models/esign/testing/signer.fixtures';
import { DisplaySigner } from '../../state/models/esign/display-signer.model';
import { PASSCODE_VIA_SMS_VOICE } from '../../state/models/esign/esign-auth-type.model';
import { DocusignSendType } from '../../state/models/esign/esign-send-type.model';
import { SignersController } from './signers.controller';

describe('SignersController — phone', () => {
  it('keeps the phone that comes with a recipient when the modal opens, formatted', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe', { identityCheck: 2, phone: '2025550191' })));

    // Global mode starts on No Identity Check, as before; the number is still there.
    expect(controller.signers[0].idCheck).toBe('0');
    expect(controller.signers[0].phone).toBe('(202) 555-0191');
  });

  it('keeps the phone when the identity check changes away from a phone-based one and back', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe', { phone: '2025550191' })), '2');
    const [signer] = controller.signers;

    controller.updateIdCheck(signer, '1');
    controller.updateIdCheck(signer, '2');

    expect(signer.phone).toBe('(202) 555-0191');
  });

  it('gives all of a person\'s roles the number that is validated', () => {
    const controller = new SignersController(signersFrom(
      recipient('Jane Doe', { phone: '2025550191', role: 'Owner', roleID: 'R1' }),
      recipient('Jane Doe', { phone: '+44 20 7946 0958', role: 'Insured', roleID: 'R2' })));
    const [signer] = controller.signers;

    expect(signer.signingRoles.map(role => role.phone)).toEqual(['(202) 555-0191', '(202) 555-0191']);
  });

  it('keeps the launch phone of a later role when the first role came without one', () => {
    const controller = new SignersController(signersFrom(
      recipient('Jane Doe', { phone: '', role: 'Owner', roleID: 'R1' }),
      recipient('Jane Doe', { phone: '2025550191', role: 'Insured', roleID: 'R2' })));
    const [signer] = controller.signers;

    expect(signer.phone).toBe('(202) 555-0191');
    expect(signer.signingRoles.map(role => role.phone)).toEqual(['(202) 555-0191', '(202) 555-0191']);
  });

  it('keeps a number that is not usable as typed, so it stays flagged', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe')), '2');
    const [signer] = controller.signers;

    controller.updatePhone(signer, '(202) 555-01912');

    expect(signer.phone).toBe('(202) 555-01912');
    expect(controller.validate()).toBe(false);
    expect(controller.isFieldInvalid(signer, 'phone')).toBe(true);
  });

  it('keeps the number as typed while it is typed, and formats it once the field is left', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe')), '2');
    const [signer] = controller.signers;

    controller.updatePhone(signer, '2025550191');
    expect(signer.phone).toBe('2025550191');

    controller.commitPhone(signer);
    expect(signer.phone).toBe('(202) 555-0191');
    expect(signer.signingRoles[0].phone).toBe('(202) 555-0191');
  });

  it('never turns a US number into a foreign one while it is typed digit by digit', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe')), '2');
    const [signer] = controller.signers;
    const typed = '3125550100';

    // The field hands back what it holds plus the new digit, as an input does on each keystroke.
    const shown = [...typed].map(digit => {
      controller.updatePhone(signer, signer.phone + digit);
      return signer.phone;
    });
    controller.commitPhone(signer);

    expect(shown).toEqual([...typed].map((_, i) => typed.slice(0, i + 1)));
    expect(signer.phone).toBe('(312) 555-0100');
    expect(controller.validate()).toBe(true);
  });

  it('checks the number again whenever it changes', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe')), '2');
    const [signer] = controller.signers;
    controller.updatePhone(signer, '2025550191');
    expect(controller.validate()).toBe(true);

    controller.updatePhone(signer, '202555');

    expect(controller.isFieldInvalid(signer, 'phone')).toBe(true);
  });

  it('flags a number that is not usable, and explains it, once a send is attempted', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe')));
    controller.setGlobalIdCheck(PASSCODE_VIA_SMS_VOICE);
    const [signer] = controller.signers;
    controller.updatePhone(signer, '1234567');

    expect(controller.hasInvalidPhone).toBe(false);
    expect(controller.validate()).toBe(false);
    expect(controller.isFieldInvalid(signer, 'phone')).toBe(true);
    expect(controller.hasInvalidPhone).toBe(true);
  });

  it('accepts a usable international number', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe')), '2');
    controller.updatePhone(controller.signers[0], '+44 20 7946 0958');

    expect(controller.validate()).toBe(true);
  });
});

describe('SignersController — retiring Passcode via SMS/Voice', () => {
  it('in global mode, moves everyone back to the admin default', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe'), recipient('John Roe')), '1');
    controller.setGlobalIdCheck(PASSCODE_VIA_SMS_VOICE);

    controller.retirePasscodeViaSmsVoice();

    expect(controller.globalIdCheck).toBe('1');
    expect(controller.signers.map(signer => signer.idCheck)).toEqual(['1', '1']);
  });

  it('in per-signer mode, changes only the rows holding the option', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe'), recipient('John Roe')), '1');
    controller.setGlobalIdCheck(PASSCODE_VIA_SMS_VOICE);
    controller.toggleGlobalConfiguration();
    const [jane, john] = controller.signers;
    controller.updateIdCheck(john, '3');
    controller.updateSendType(john, DocusignSendType.InPersonSigner);

    controller.retirePasscodeViaSmsVoice();

    expect(jane.idCheck).toBe('1');
    expect(jane.signingRoles[0].idCheck).toBe('1');
    expect(john.idCheck).toBe('3');
    expect(john.sendType).toBe(DocusignSendType.InPersonSigner);
    // The global value is reset too, so returning to global mode does not re-apply a hidden option.
    expect(controller.globalIdCheck).toBe('1');
  });

  it('leaves everything alone when nobody holds the option', () => {
    const controller = new SignersController(signersFrom(recipient('Jane Doe')), '2');

    controller.retirePasscodeViaSmsVoice();

    expect(controller.globalIdCheck).toBe('2');
    expect(controller.signers[0].idCheck).toBe('2');
  });
});
