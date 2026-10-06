import { normalizeSignerPhone } from './phone-number';

describe('normalizeSignerPhone', () => {
  it.each([
    ['2025550191'],
    ['(202) 555-0191'],
    ['202.555.0191'],
    ['12025550191'],
    ['+1 202 555 0191']
  ])('reads %s as a US number', input => {
    expect(normalizeSignerPhone(input)).toEqual({
      display: '(202) 555-0191',
      nationalNumber: '2025550191',
      countryCallingCode: '1',
      isValid: true
    });
  });

  it('reads a number with a leading + as international', () => {
    expect(normalizeSignerPhone('+44 20 7946 0958')).toEqual({
      display: '+44 20 7946 0958',
      nationalNumber: '2079460958',
      countryCallingCode: '44',
      isValid: true
    });
  });

  it('reads a full number typed without the + as international', () => {
    const result = normalizeSignerPhone('442079460958');

    expect(result.countryCallingCode).toBe('44');
    expect(result.nationalNumber).toBe('2079460958');
    expect(result.display).toBe('+44 20 7946 0958');
  });

  it('keeps the country code for other countries', () => {
    const result = normalizeSignerPhone('+61 491 570 006');

    expect(result.isValid).toBe(true);
    expect(result.countryCallingCode).toBe('61');
    expect(result.nationalNumber).toBe('491570006');
  });

  it.each([[''], ['   '], ['1234567'], ['555-01ab']])('treats %p as not usable', input => {
    const result = normalizeSignerPhone(input);

    expect(result.isValid).toBe(false);
    expect(result.nationalNumber).toBe('');
    expect(result.countryCallingCode).toBe('');
  });

  it('keeps a number that is not usable exactly as typed', () => {
    expect(normalizeSignerPhone(' (202) 555 ').display).toBe('(202) 555');
    expect(normalizeSignerPhone('(202) 555-01912').display).toBe('(202) 555-01912');
  });

  // What is stored is the display; validation and the request read it again. That second reading must
  // give the same answer — in particular, a mistyped US number must not turn into a foreign one.
  it.each([
    ['(202) 555-0191'],
    ['(202) 555-01912'],
    ['2025550191'],
    ['+44 20 7946 0958'],
    ['442079460958'],
    ['(202'],
    ['1234567']
  ])('reads %p the same when its display is read again', input => {
    const first = normalizeSignerPhone(input);
    const again = normalizeSignerPhone(first.display);

    expect(again.isValid).toBe(first.isValid);
    expect(again.countryCallingCode).toBe(first.countryCallingCode);
    expect(again.nationalNumber).toBe(first.nationalNumber);
  });

  it('does not accept a US number with an extra digit as a foreign number', () => {
    const stored = normalizeSignerPhone('(202) 555-01912').display;

    expect(normalizeSignerPhone(stored).isValid).toBe(false);
  });
});
