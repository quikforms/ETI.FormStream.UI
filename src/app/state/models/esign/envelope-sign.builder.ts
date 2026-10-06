import { EsignData } from '../Response/esign-data.model';
import { FormValueInput, serializeForms } from '../render/form-value.serializer';
import { DisplaySigner } from './display-signer.model';
import { isPhoneBasedIdCheck, toDocusignIdentityCheckValue } from './esign-auth-type.model';
import { EnvelopeSignRequest } from './envelope-sign-request.model';
import { normalizeSignerPhone, US_COUNTRY_CALLING_CODE } from './phone-number';

// Flattens the display signers into their signing roles and maps each into a DocuSign recipient. Only
// roles that identify a real recipient are included — a name AND email, or a signing group — which
// naturally drops unassigned baseline roles. The ID Check travels only as IdentityCheck, an int; the
// modal's own key for it (which can be a name such as Passcode via SMS/Voice's) stays in the modal. A
// phone-based check sends the phone as its national number and country calling code (both empty when the
// number is not usable); any other check sends no phone at all, even if the signer still holds one. Pure.
export function buildRecipients(signers: DisplaySigner[]): any[] {
  return signers
    .flatMap(signer => signer.signingRoles)
    .filter(role =>
      (!!role.name && role.name.trim() !== '' && !!role.mail && role.mail.trim() !== '') ||
      (!!role.signingGroup && role.signingGroup.trim() !== ''))
    .map(role => {
      const { phone, idCheck, ...rest } = role;
      const recipient: any = { ...rest, IdentityCheck: toDocusignIdentityCheckValue(idCheck) };
      if (isPhoneBasedIdCheck(idCheck)) {
        const normalized = normalizeSignerPhone(phone);
        recipient.phone = phone;
        recipient.PhoneNumber = normalized.isValid ? normalized.nationalNumber : '';
        recipient.PhoneNumberCountryCode = normalized.isValid ? normalized.countryCallingCode : '';
      }
      return recipient;
    });
}

// Whether any recipient is sent with a phone number outside calling code +1. Read from the built
// recipients, so only phones that actually travel count — a number a signer holds under a non-phone check
// does not. The international path is for other calling codes: numbers that share +1 with the US (Canada,
// the Caribbean) go out like US numbers, as their national number and code 1, which is how they are
// dialed. They are still displayed in international form, since they are not US numbers.
export function hasInternationalPhone(recipients: any[]): boolean {
  return recipients.some(recipient =>
    !!recipient.PhoneNumberCountryCode && recipient.PhoneNumberCountryCode !== US_COUNTRY_CALLING_CODE);
}

// Refreshes the baked PrintData field values from the live form so the signed PDF reflects the advisor's
// current edits. Each PrintData form's HTMLFields[].Value is overwritten by the current form value where
// the field name matches, joined per form by FormID + FormInstance and per field by Name == fieldName.
// Reuses the same serialization Save/Print use (so the value format is the one the backend expects).
// Fields not present in the live form — engine-derived fields (FullName, CityState, …) the element cannot
// recompute — keep their baseline value. Editable e-sign tabs are refreshed separately. Pure.
export function refreshPrintDataHtmlFields(printData: any, formValues: FormValueInput[]): any {
  if (!printData || !Array.isArray(printData.Fields)) { return printData; }

  const valuesByForm = new Map<string, Map<string, string>>();
  serializeForms(formValues).forEach(form => {
    const map = new Map<string, string>();
    form.fields.forEach(field => map.set(field.fieldName, field.value));
    valuesByForm.set(`${form.formId}|${form.formInstance}`, map);
  });

  return {
    ...printData,
    Fields: printData.Fields.map((form: any) => {
      const map = valuesByForm.get(`${form.FormID}|${form.FormInstance}`);
      if (!map || !Array.isArray(form.HTMLFields)) { return form; }
      return {
        ...form,
        HTMLFields: form.HTMLFields.map((htmlField: any) =>
          map.has(htmlField.Name) ? { ...htmlField, Value: map.get(htmlField.Name) } : htmlField)
      };
    })
  };
}

// Builds the envelope-sign request from the launch baseline and the modal's recipients/messaging, with
// the PrintData field values refreshed from the live form. The editable e-sign tab values (SignData
// TextTabs/CheckboxTabs/RadioGroupTabs) are refreshed in a separate step; signature tabs are untouched.
// Pure.
export function buildEnvelopeSignRequest(params: {
  esignData: EsignData;
  signers: DisplaySigner[];
  messageSubject: string;
  messageBody: string;
  customerId: string;
  packageId: string | number;
  formValues: FormValueInput[];
}): EnvelopeSignRequest {
  const { esignData, signers, messageSubject, messageBody, customerId, packageId, formValues } = params;

  const signSettings = {
    ...(esignData.signSettings ?? {}),
    Status: 'sent',
    MailSubject: messageSubject,
    MailBody: messageBody
  };

  const printData = refreshPrintDataHtmlFields({
    ...(esignData.printData ?? {}),
    SignAllDocsCombined: true,
    ForSign: true,
    EditablePDF: true
  }, formValues);

  const recipients = buildRecipients(signers);
  const signData = {
    ...(esignData.signData ?? {}),
    Recipients: recipients
  };

  return {
    CustomerID: customerId,
    SignSettings: signSettings,
    PackagesData: [{ PackageId: packageId, PrintData: printData, SignData: signData }],
    EnableInternationalPhoneNumber: hasInternationalPhone(recipients)
  };
}
