type ServerTelemetryLevel = 'info' | 'warn' | 'error'

export type ServerTelemetryEvent = {
    name: string
    route: string
    action: string
    level?: ServerTelemetryLevel
    message?: string
    userId?: string | null
    orgType?: string | null
    memberRole?: string | null
    metadata?: Record<string, unknown>
}

export function logServerTelemetry(_event: ServerTelemetryEvent): void {
    // Telemetry disabled by product decision.
    void _event
}
