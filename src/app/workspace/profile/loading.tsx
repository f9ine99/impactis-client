export default function WorkspaceProfileLoading() {
    return (
        <main data-workspace-root="true" className="relative min-h-screen overflow-hidden bg-[#070b14] text-slate-100">
            <div className="relative mx-auto max-w-[1400px] px-6 py-8 md:py-12">
                <div className="flex flex-col gap-10">
                    <div className="h-64 rounded-[2.5rem] border border-white/5 bg-slate-900/60 animate-pulse" />

                    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
                        <aside className="space-y-6">
                            <div className="space-y-3 rounded-3xl border border-white/5 bg-slate-900/60 p-3">
                                <div className="h-11 rounded-2xl bg-slate-800 animate-pulse" />
                                <div className="h-11 rounded-2xl bg-slate-800 animate-pulse" />
                                <div className="h-11 rounded-2xl bg-slate-800 animate-pulse" />
                            </div>
                            <div className="h-44 rounded-3xl border border-white/5 bg-slate-900/60 animate-pulse" />
                        </aside>

                        <section className="space-y-6">
                            <div className="h-28 rounded-3xl border border-white/5 bg-slate-900/60 animate-pulse" />
                            <div className="h-[540px] rounded-3xl border border-white/5 bg-slate-900/60 animate-pulse" />
                        </section>
                    </div>
                </div>
            </div>
        </main>
    )
}
