export default function WorkspaceLoading() {
    return (
        <main
            data-workspace-root="true"
            aria-label="Loading workspace"
            className="flex h-screen overflow-hidden bg-[#070b14] text-slate-100"
        >
            <aside className="hidden w-[280px] shrink-0 border-r border-white/5 bg-slate-900/60 p-8 md:flex md:flex-col">
                <div className="h-8 w-28 rounded-lg bg-slate-800 animate-pulse" />
                <div className="mt-12 space-y-3">
                    <div className="h-12 rounded-2xl bg-slate-800 animate-pulse" />
                    <div className="h-12 rounded-2xl bg-slate-800 animate-pulse" />
                    <div className="h-12 rounded-2xl bg-slate-800 animate-pulse" />
                </div>
                <div className="mt-auto h-12 rounded-2xl bg-slate-800 animate-pulse" />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/5 px-6 md:px-10">
                    <div className="h-4 w-40 rounded bg-slate-800 animate-pulse" />
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 animate-pulse" />
                        <div className="h-9 w-28 rounded-xl bg-slate-800 animate-pulse" />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="mx-auto max-w-[1440px] space-y-8">
                        <div className="h-32 rounded-[2.5rem] border border-white/5 bg-slate-900/60 animate-pulse" />
                        <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
                            <div className="space-y-8">
                                <div className="h-[360px] rounded-[3rem] border border-white/5 bg-slate-900/60 animate-pulse" />
                                <div className="h-[280px] rounded-[3rem] border border-white/5 bg-slate-900/60 animate-pulse" />
                            </div>
                            <div className="space-y-8">
                                <div className="h-56 rounded-[3rem] border border-white/5 bg-slate-900/60 animate-pulse" />
                                <div className="h-44 rounded-[2.5rem] border border-white/5 bg-slate-900/60 animate-pulse" />
                                <div className="h-72 rounded-[3rem] border border-white/5 bg-slate-900/60 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
