export const ONBOARDING_PATH = '/onboarding'

export function getOnboardingPath(): string {
    return ONBOARDING_PATH
}

export function isOnboardingPath(pathname: string): boolean {
    return pathname === ONBOARDING_PATH
}
