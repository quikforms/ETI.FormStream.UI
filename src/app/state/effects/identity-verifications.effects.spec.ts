import { Actions } from '@ngrx/effects';
import { Observable, of, throwError } from 'rxjs';
import { toArray } from 'rxjs/operators';
import {
    LoadIdentityVerificationsFail,
    LoadIdentityVerificationsSuccess,
    TryLoadIdentityVerifications
} from '../actions/identity-verifications.actions';
import { IdentityVerificationsEffects } from './identity-verifications.effects';

const request = { SignEnvironmentID: 2, AuthUserID: 'Test connection' };
const url = 'https://api.example.com/esign/formstream/docusign/identity-verifications';

// Runs the effect for one TryLoad with the given endpoints and HTTP behaviour; returns what it emitted
// and the calls the HTTP service received.
async function run(endpoints: any, post: (url: string, body: any) => Observable<any>) {
    const calls: [string, any][] = [];
    const http = { post: (postUrl: string, body: any) => { calls.push([postUrl, body]); return post(postUrl, body); } };
    const store = { select: () => of(endpoints) };
    const effects = new IdentityVerificationsEffects(
        new Actions(of(new TryLoadIdentityVerifications(request))), store as any, http as any);

    const emitted = await effects.tryLoadIdentityVerifications.pipe(toArray()).toPromise();
    return { emitted, calls };
}

describe('IdentityVerificationsEffects', () => {
    it('posts the request and reports the capability', async () => {
        const { emitted, calls } = await run(
            { esign: { identityVerifications: url } },
            () => of({ HasPhoneAuthenticationCapability: true }));

        expect(calls).toEqual([[url, request]]);
        expect(emitted).toEqual([new LoadIdentityVerificationsSuccess(true)]);
    });

    it('reports not supported when the response does not say so', async () => {
        const { emitted } = await run({ esign: { identityVerifications: url } }, () => of(''));

        expect(emitted).toEqual([new LoadIdentityVerificationsSuccess(false)]);
    });

    it('settles as a failure when the request fails', async () => {
        const { emitted } = await run({ esign: { identityVerifications: url } }, () => throwError({ status: 404 }));

        expect(emitted).toEqual([new LoadIdentityVerificationsFail({ status: 404 })]);
    });

    it.each([[null], [{}], [{ esign: {} }]])('settles as a failure without calling anything when endpoints are %p', async endpoints => {
        const { emitted, calls } = await run(endpoints, () => of({ HasPhoneAuthenticationCapability: true }));

        expect(calls).toEqual([]);
        expect(emitted).toHaveLength(1);
        expect(emitted![0]).toBeInstanceOf(LoadIdentityVerificationsFail);
    });
});
