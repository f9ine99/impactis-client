export default function HeroVideoCard() {
    const videoId = 'D7lLkTQaueQ'
    const videoSrc = `https://www.youtube.com/embed/${videoId}?si=zIcwKKetX-R4dhwm&autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&loop=1&playlist=${videoId}`

    return (
        <div className="w-full max-w-4xl mx-auto h-[450px] mb-8 px-4 relative group perspective-1000">
            {/* Horizontal Emit Glow — full width beam */}
            <div className="absolute -inset-3 rounded-[4rem] overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                <div className="absolute -inset-x-0 h-[6px] top-1/2 -translate-y-1/2 bg-[#10B981] blur-xl animate-glow-sweep"></div>
                <div className="absolute -inset-x-0 h-[2px] top-1/2 -translate-y-1/2 bg-[#10B981] blur-sm animate-glow-sweep"></div>
            </div>

            {/* The Video Container with 3D flip-in entrance */}
            <div className="relative w-full h-full bg-gray-950 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border-8 border-white transition-transform duration-700 group-hover:scale-[1.02] animate-hero-entrance">
                <iframe
                    className="w-full h-full scale-[1.01]"
                    src={videoSrc}
                    title="Impactis Platform Overview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                ></iframe>

                {/* Subtle Texture Layer */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none"></div>
            </div>

            {/* Animated corner accents */}
            <div className="absolute -top-2 -left-2 w-16 h-16 border-t-2 border-l-2 border-[#10B981]/30 rounded-tl-[2rem] animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-16 h-16 border-t-2 border-r-2 border-[#10B981]/30 rounded-tr-[2rem] animate-pulse [animation-delay:500ms]"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 border-b-2 border-l-2 border-[#10B981]/30 rounded-bl-[2rem] animate-pulse [animation-delay:1000ms]"></div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-2 border-r-2 border-[#10B981]/30 rounded-br-[2rem] animate-pulse [animation-delay:1500ms]"></div>
        </div>
    )
}
