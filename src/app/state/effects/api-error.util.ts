/**
 * Extracts the most useful, user-facing message from a failed API call.
 *
 * Angular surfaces HTTP failures as an HttpErrorResponse whose `message` is a generic string
 * ("Http failure response for <url>: 400 OK") and whose `error` holds the parsed response body —
 * where the backend's own, precise message lives (e.g. { Message, Errors: [{ Message }] }). This
 * prefers that backend message so the end user sees what actually went wrong (e.g. a DocuSign
 * validation error), and falls back to a friendly default only when nothing usable was provided.
 */
export function extractApiErrorMessage(error: any, fallback: string): string {
  const body = error?.error;

  if (body && typeof body === 'object') {
    const message = body.Message || body.message
      || (Array.isArray(body.Errors) && body.Errors[0] && body.Errors[0].Message);
    if (typeof message === 'string' && message.trim()) { return message; }
  }

  if (typeof body === 'string' && body.trim()) { return body; }

  // The error may already be a plain API error body rather than an HttpErrorResponse.
  const direct = error?.Message || (typeof error === 'string' ? error : '');
  if (typeof direct === 'string' && direct.trim()) { return direct; }

  return fallback;
}
