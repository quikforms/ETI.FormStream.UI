import { SignSettingsBaseline } from './sign-settings-baseline.model';

// The request body posted to docusign/identity-verifications: the DocuSign environment and the connection
// whose phone authentication support is checked.
export interface IdentityVerificationsRequest {
  SignEnvironmentID: number;
  AuthUserID: string;
}

// Builds the request from the SignSettings baseline, or returns null when the baseline does not identify
// a connection — in which case there is nothing to ask, and phone authentication is not offered. Pure.
export function buildIdentityVerificationsRequest(
  signSettings: SignSettingsBaseline | null | undefined
): IdentityVerificationsRequest | null {
  const authUserId = signSettings?.AuthUserID;
  const signEnvironmentId = Number(signSettings?.SignEnvironmentID);
  if (typeof authUserId !== 'string' || !authUserId.trim() || !Number.isInteger(signEnvironmentId) || signEnvironmentId <= 0) {
    return null;
  }
  return { SignEnvironmentID: signEnvironmentId, AuthUserID: authUserId };
}

// Identifies the account a request asks about, so each answer is stored for that account only. The store is
// shared by every element on the page, and two of them may ask about different accounts at the same time.
// Pure.
export function identityVerificationsKey(request: IdentityVerificationsRequest): string {
  return `${request.SignEnvironmentID}|${request.AuthUserID}`;
}

// Reads the capability from the response body. Any shape that does not say "supported" — including an
// empty body — reads as not supported. Pure.
export function hasPhoneAuthentication(response: any): boolean {
  return !!(response?.HasPhoneAuthenticationCapability || response?.hasPhoneAuthenticationCapability);
}
