export function parseTagsFromText(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    )
}

export function serializeTags(tags: string[]): string {
    return tags.join(', ')
}

export function normalizeTagValue(value: string): string {
    return value.replace(/\s+/g, ' ').trim()
}

export function splitInputIntoTags(value: string): string[] {
    return value
        .split(',')
        .map((item) => normalizeTagValue(item))
        .filter((item) => item.length > 0)
}

export function formatFileSize(value: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
        return 'Unknown size'
    }

    if (value < 1024 * 1024) {
        return `${Math.round(value / 1024)} KB`
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
