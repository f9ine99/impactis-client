import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Impactis | Premium Fintech Platform",
  description: "Connect startups, investors, and consultants in a trusted ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var u=new URL(window.location.href);var q=u.searchParams.get('theme');var m=document.cookie.match(/(?:^|;\\s*)workspace_theme=([^;]+)/);var c=m?decodeURIComponent(m[1]):null;var s=null;try{s=window.localStorage.getItem('workspace-theme');}catch(_e){}var t=(q==='light'||q==='dark')?q:(s||c||'dark');if(t==='light'){document.documentElement.classList.add('workspace-theme-light');document.documentElement.classList.remove('dark');}else{document.documentElement.classList.remove('workspace-theme-light');document.documentElement.classList.add('dark');}if(t==='light'||t==='dark'){try{window.localStorage.setItem('workspace-theme',t);}catch(_e){}document.cookie='workspace_theme='+t+'; Path=/; Max-Age=31536000; SameSite=Lax';if(u.searchParams.has('theme')){u.searchParams.delete('theme');window.history.replaceState(window.history.state,'',u.toString());}}}catch(_e){}})();`,
          }}
        />
      </head>
      <body className="antialiased text-gray-900">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
