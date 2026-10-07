import { Actions } from '@ngrx/effects';
import { Observable, of, Subject, throwError } from 'rxjs';
import { toArray } from 'rxjs/operators';
import {
    LoadIdentityVerificationsFail,
    LoadIdentityVerificationsSuccess,
    TryLoadIdentityVerifications
} from '../actions/identity-verifications.actions';
import { IdentityVerificationsEffects } from './identity-verifications.effects';

const request = { SignEnvironmentID: 2, AuthUserID: 'Test connection' };
const key = new TryLoadIdentityVerifications(request).key;
const url = 'https://api.example.com/esign/formstream/docusign/identity-verifications';
const endpoints = { esign: { identityVerifications: url } };

const effectsFor = (actions: Observable<any>, endpointsValue: any, http: { post: (url: string, body: any) => Observable<any> }) =>
    new IdentityVerificationsEffects(new Actions(actions), { select: () => of(endpointsValue) } as any, http as any);

// Runs the effect for one TryLoad with the given endpoints and HTTP behaviour; returns what it emitted
// and the calls the HTTP service received.
async function run(endpointsValue: any, post: (url: string, body: any) => Observable<any>) {
    const calls: [string, any][] = [];
    const http = { post: (postUrl: string, body: any) => { calls.push([postUrl, body]); return post(postUrl, body); } };
    const effects = effectsFor(of(new TryLoadIdentityVerifications(request)), endpointsValue, http);

    const emitted = await effects.tryLoadIdentityVerifications.pipe(toArray()).toPromise();
    return { emitted, calls };
}

describe('IdentityVerificationsEffects', () => {
    it('posts the request and reports the capability for that account', async () => {
        const { emitted, calls } = await run(endpoints, () => of({ HasPhoneAuthenticationCapability: true }));

        expect(calls).toEqual([[url, request]]);
        expect(emitted).toEqual([new LoadIdentityVerificationsSuccess(key, true)]);
    });

    it('reports not supported when the response does not say so', async () => {
        const { emitted } = await run(endpoints, () => of(''));

        expect(emitted).toEqual([new LoadIdentityVerificationsSuccess(key, false)]);
    });

    it('settles as a failure when the request fails', async () => {
        const { emitted } = await run(endpoints, () => throwError({ status: 404 }));

        expect(emitted).toEqual([new LoadIdentityVerificationsFail(key, { status: 404 })]);
    });

    it.each([[null], [{}], [{ esign: {} }]])('settles as a failure without calling anything when endpoints are %p', async endpointsValue => {
        const { emitted, calls } = await run(endpointsValue, () => of({ HasPhoneAuthenticationCapability: true }));

        expect(calls).toEqual([]);
        expect(emitted).toHaveLength(1);
        expect(emitted![0]).toBeInstanceOf(LoadIdentityVerificationsFail);
        expect((emitted![0] as LoadIdentityVerificationsFail).key).toBe(key);
    });

    it('answers every account asked about, even when a second lookup starts before the first one answers', () => {
        const actions = new Subject<any>();
        const responses: { [authUserId: string]: Subject<any> } = { A: new Subject(), B: new Subject() };
        const effects = effectsFor(actions, endpoints, { post: (_: string, body: any) => responses[body.AuthUserID] });
        const emitted: any[] = [];
        effects.tryLoadIdentityVerifications.subscribe(action => emitted.push(action));

        const lookupA = new TryLoadIdentityVerifications({ SignEnvironmentID: 2, AuthUserID: 'A' });
        const lookupB = new TryLoadIdentityVerifications({ SignEnvironmentID: 2, AuthUserID: 'B' });
        actions.next(lookupA);
        actions.next(lookupB);
        responses.A.next({ HasPhoneAuthenticationCapability: true });
        responses.B.next({ HasPhoneAuthenticationCapability: false });

        expect(emitted).toEqual([
            new LoadIdentityVerificationsSuccess(lookupA.key, true),
            new LoadIdentityVerificationsSuccess(lookupB.key, false)
        ]);
    });
});
