/**
 * Production API endpoints for the FormStream element.
 *
 * These are Quik's public production services, baked into the distributed bundle so an
 * embedding host never has to configure them. Only production endpoints live in this public
 * repository; per-environment endpoints for internal (non-production) use are supplied by the
 * first-party host at consumption time via the element's `apiConfig` input (see
 * FormStreamComponent) and are never committed here.
 *
 * `idpClientId` is the one entry that is not a URL. It names the OAuth client a session's token was
 * issued to, which the token endpoint reads when the access token is renewed: a renewal that does not
 * present the issuing client is refused. Production issues these tokens to `formstreamclient`, so the
 * distributed bundle carries that name and an embedding host supplies nothing. A first-party host
 * pointing the element at another environment overrides it through `apiConfig`, like the base URLs.
 */
export const API_CONFIG = {
  auth: 'https://auth.quikformsapp.com/',
  qfe: 'https://websvcs.quikforms.com/rest/quikformsengine/',
  idp: 'https://websvcs.quikforms.com/rest_authentication/token',
  esign: 'https://websvcs.quikforms.com/rest/esignature/',
  idpClientId: 'formstreamclient'
};

/**
 * Shape of the API base-URL map. A first-party host may pass a partial of this through the
 * element's `apiConfig` input to point a non-production embedding at a different environment;
 * any key left unset falls back to the baked production value in API_CONFIG.
 */
export type ApiConfig = typeof API_CONFIG;
