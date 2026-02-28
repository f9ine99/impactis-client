'use client'

import { Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import {
    normalizeTagValue,
    parseTagsFromText,
    serializeTags,
    splitInputIntoTags,
} from './utils'

type TagEditorProps = {
    id: string
    name: string
    label: string
    description?: string
    placeholder: string
    defaultValue: string
    disabled: boolean
    suggestions: string[]
    inputClass: string
    labelClass: string
    textMutedClass: string
    isLight: boolean
    suggestionLimit?: number
    hideLabelAndDescription?: boolean
}

export function TagEditor(input: TagEditorProps) {
    const { hideLabelAndDescription = false } = input
    const initialTags = useMemo(() => parseTagsFromText(input.defaultValue), [input.defaultValue])
    const [tags, setTags] = useState<string[]>(initialTags)
    const [draft, setDraft] = useState('')

    useEffect(() => {
        setTags(initialTags)
    }, [initialTags])

    const tagsLookup = useMemo(() => new Set(tags.map((tag) => tag.toLowerCase())), [tags])
    const availableSuggestions = input.suggestions.filter((tag) => !tagsLookup.has(tag.toLowerCase()))

    function addTagsFromValue(rawValue: string) {
        const candidateTags = splitInputIntoTags(rawValue)
        if (candidateTags.length === 0) {
            return
        }

        setTags((previousTags) => {
            const seen = new Set(previousTags.map((tag) => tag.toLowerCase()))
            const nextTags = [...previousTags]

            for (const tag of candidateTags) {
                const key = tag.toLowerCase()
                if (!seen.has(key)) {
                    seen.add(key)
                    nextTags.push(tag)
                }
            }

            return nextTags
        })
    }

    function addTag(tag: string) {
        addTagsFromValue(tag)
        setDraft('')
    }

    function removeTag(tag: string) {
        const target = tag.toLowerCase()
        setTags((previousTags) => previousTags.filter((item) => item.toLowerCase() !== target))
    }

    function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            if (draft.trim().length > 0) {
                addTag(draft)
            }
            return
        }

        if (event.key === 'Backspace' && draft.length === 0 && tags.length > 0) {
            event.preventDefault()
            setTags((previousTags) => previousTags.slice(0, -1))
        }
    }

    function handleDraftBlur() {
        if (draft.trim().length > 0) {
            addTag(draft)
        }
    }

    const containerClass = input.isLight
        ? 'border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-emerald-500/50'
        : 'border-slate-800 bg-slate-950/50 focus-within:bg-slate-950 focus-within:border-emerald-500/50'
    const chipClass = input.isLight
        ? 'border-slate-200 bg-white text-slate-700 shadow-sm'
        : 'border-slate-700 bg-slate-900 text-slate-200 shadow-xl'
    const textMainClass = input.isLight ? 'text-slate-900' : 'text-slate-100'

    return (
        <div className={hideLabelAndDescription ? '' : 'sm:col-span-2'}>
            {!hideLabelAndDescription && (
                <label htmlFor={input.id} className={`mb-3 block text-[10px] font-black uppercase tracking-widest ${input.labelClass}`}>
                    {input.label}
                </label>
            )}
            <input type="hidden" name={input.name} value={serializeTags(tags)} />

            <div className={`flex min-h-14 w-full flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 transition-all ${containerClass}`}>
                {tags.map((tag) => (
                    <span key={tag} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 ${chipClass}`}>
                        {tag}
                        {!input.disabled ? (
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="group relative rounded-full p-0.5"
                                aria-label={`Remove ${tag}`}
                            >
                                <div className="absolute inset-0 scale-50 rounded-full bg-rose-500 opacity-0 transition-all group-hover:scale-110 group-hover:opacity-100" />
                                <X className="relative h-3 w-3 transition-all group-hover:text-white" />
                            </button>
                        ) : null}
                    </span>
                ))}

                <input
                    id={input.id}
                    value={draft}
                    onChange={(event) => setDraft(normalizeTagValue(event.target.value))}
                    onKeyDown={handleDraftKeyDown}
                    onBlur={handleDraftBlur}
                    disabled={input.disabled}
                    placeholder={tags.length === 0 ? input.placeholder : 'Add more...'}
                    className={`min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1 text-sm font-medium outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 ${textMainClass}`}
                />
            </div>

            {input.description && !hideLabelAndDescription ? (
                <p className={`mt-3 text-[10px] font-medium leading-relaxed ${input.textMutedClass}`}>{input.description}</p>
            ) : null}

            {availableSuggestions.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    {availableSuggestions.slice(0, input.suggestionLimit ?? 10).map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            disabled={input.disabled}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${input.isLight
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                        >
                            <Plus className="h-3 w-3" />
                            {tag}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
