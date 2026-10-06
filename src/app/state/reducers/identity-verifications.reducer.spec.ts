import {
    ClearIdentityVerifications,
    LoadIdentityVerificationsFail,
    LoadIdentityVerificationsSuccess,
    TryLoadIdentityVerifications
} from '../actions/identity-verifications.actions';
import {
    IdentityVerificationsReducer,
    IdentityVerificationsSelectors,
    IdentityVerificationsState,
    initialIdentityVerificationsState
} from './identity-verifications.reducer';

const request = { SignEnvironmentID: 2, AuthUserID: 'Test connection' };
const capableState: IdentityVerificationsState = { capable: true, loading: false, failed: false };

describe('IdentityVerificationsReducer', () => {
    it('starts as not supported', () => {
        expect(IdentityVerificationsReducer(undefined, { type: '@@init' } as any)).toEqual(initialIdentityVerificationsState);
    });

    it('discards the previous answer when a new lookup starts', () => {
        expect(IdentityVerificationsReducer(capableState, new TryLoadIdentityVerifications(request)))
            .toEqual({ capable: false, loading: true, failed: false });
    });

    it('stores the answer when the lookup succeeds', () => {
        const loading = IdentityVerificationsReducer(undefined, new TryLoadIdentityVerifications(request));

        expect(IdentityVerificationsReducer(loading, new LoadIdentityVerificationsSuccess(true)))
            .toEqual({ capable: true, loading: false, failed: false });
    });

    it('settles as not supported when the lookup fails', () => {
        // Applied to a supporting state directly, so the failure itself has to clear the answer.
        expect(IdentityVerificationsReducer(capableState, new LoadIdentityVerificationsFail('error')))
            .toEqual({ capable: false, loading: false, failed: true });
    });

    it('returns to the initial state when cleared', () => {
        expect(IdentityVerificationsReducer(capableState, new ClearIdentityVerifications()))
            .toEqual(initialIdentityVerificationsState);
    });
});

describe('IdentityVerificationsSelectors', () => {
    const root = (state: IdentityVerificationsState) => ({ identityVerificationsReducer: state });

    it('offers Passcode via SMS/Voice only for a supporting account', () => {
        const names = (state: IdentityVerificationsState) =>
            IdentityVerificationsSelectors.selectIdCheckOptions(root(state)).map(option => option.name);

        expect(names(capableState)).toContain('Passcode via SMS/Voice');
        expect(names(initialIdentityVerificationsState)).not.toContain('Passcode via SMS/Voice');
    });

    it('keeps the same option list while the capability does not change', () => {
        const loading = { capable: false, loading: true, failed: false };
        const failed = { capable: false, loading: false, failed: true };

        expect(IdentityVerificationsSelectors.selectIdCheckOptions(root(failed)))
            .toBe(IdentityVerificationsSelectors.selectIdCheckOptions(root(loading)));
    });
});
