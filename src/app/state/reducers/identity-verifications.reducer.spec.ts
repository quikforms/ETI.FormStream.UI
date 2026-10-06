import {
    LoadIdentityVerificationsFail,
    LoadIdentityVerificationsSuccess,
    TryLoadIdentityVerifications
} from '../actions/identity-verifications.actions';
import {
    idCheckOptionsWithoutPhoneAuthentication,
    IdentityVerificationsReducer,
    IdentityVerificationsSelectors,
    IdentityVerificationsState,
    initialIdentityVerificationsState
} from './identity-verifications.reducer';

const accountA = new TryLoadIdentityVerifications({ SignEnvironmentID: 2, AuthUserID: 'Connection A' });
const accountB = new TryLoadIdentityVerifications({ SignEnvironmentID: 2, AuthUserID: 'Connection B' });

const reduce = (...actions: any[]) =>
    actions.reduce((state, action) => IdentityVerificationsReducer(state, action), undefined as unknown as IdentityVerificationsState);

describe('IdentityVerificationsReducer', () => {
    it('starts with no answers', () => {
        expect(reduce({ type: '@@init' })).toEqual(initialIdentityVerificationsState);
    });

    it('marks the account as loading when it is asked about', () => {
        expect(reduce(accountA).accounts[accountA.key]).toEqual({ capable: false, loading: true });
    });

    it('stores the answer for the account that was asked about', () => {
        expect(reduce(accountA, new LoadIdentityVerificationsSuccess(accountA.key, true)).accounts[accountA.key])
            .toEqual({ capable: true, loading: false });
    });

    it('settles as not supported when the lookup fails', () => {
        const state = reduce(
            accountA, new LoadIdentityVerificationsSuccess(accountA.key, true),
            accountA, new LoadIdentityVerificationsFail(accountA.key, 'error'));

        expect(state.accounts[accountA.key]).toEqual({ capable: false, loading: false });
    });

    it('keeps the previous answer for the same account while it is asked again', () => {
        const state = reduce(accountA, new LoadIdentityVerificationsSuccess(accountA.key, true), accountA);

        expect(state.accounts[accountA.key]).toEqual({ capable: true, loading: true });
    });

    it('never lets the answer for one account reach another, whatever order they arrive in', () => {
        const state = reduce(
            accountA, accountB,
            new LoadIdentityVerificationsSuccess(accountA.key, true),
            new LoadIdentityVerificationsSuccess(accountB.key, false));

        expect(state.accounts[accountA.key]).toEqual({ capable: true, loading: false });
        expect(state.accounts[accountB.key]).toEqual({ capable: false, loading: false });
    });
});

describe('IdentityVerificationsSelectors', () => {
    const root = (state: IdentityVerificationsState) => ({ identityVerificationsReducer: state });
    const names = (state: IdentityVerificationsState, key: string) =>
        IdentityVerificationsSelectors.selectIdCheckOptions(key)(root(state)).map(option => option.name);

    it('offers Passcode via SMS/Voice only for a supporting account', () => {
        const state = reduce(
            accountA, new LoadIdentityVerificationsSuccess(accountA.key, true),
            accountB, new LoadIdentityVerificationsSuccess(accountB.key, false));

        expect(names(state, accountA.key)).toContain('Passcode via SMS/Voice');
        expect(names(state, accountB.key)).not.toContain('Passcode via SMS/Voice');
    });

    it('does not offer it for an account that was never asked about', () => {
        const state = reduce(accountA, new LoadIdentityVerificationsSuccess(accountA.key, true));

        expect(names(state, accountB.key)).not.toContain('Passcode via SMS/Voice');
        expect(IdentityVerificationsSelectors.selectIdentityVerificationsLoading(accountB.key)(root(state))).toBe(false);
    });

    it('keeps the same option list while the answer does not change', () => {
        const selectOptions = IdentityVerificationsSelectors.selectIdCheckOptions(accountA.key);
        const loading = reduce(accountA);
        const failed = reduce(accountA, new LoadIdentityVerificationsFail(accountA.key, 'error'));

        expect(selectOptions(root(failed))).toBe(selectOptions(root(loading)));
        expect(selectOptions(root(failed))).toBe(idCheckOptionsWithoutPhoneAuthentication());
    });
});
