export const ONBOARDING_QUESTIONS_PATH = '/onboarding/questions'

export function getOnboardingPath(): string {
    return ONBOARDING_QUESTIONS_PATH
}

export function getOnboardingQuestionsPath(): string {
    return ONBOARDING_QUESTIONS_PATH
}

export function isOnboardingPath(pathname: string): boolean {
    return pathname.startsWith('/onboarding')
}
