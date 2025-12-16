import { SsoService } from '@bogdanovmn/ssofw';
import { authStore } from '@/stores/auth';

export function logout(ssoService: SsoService): void {
    const auth = authStore();
    ssoService.deleteRefreshToken()
        .finally(() => {
            auth.update();
        });
}