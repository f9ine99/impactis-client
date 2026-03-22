import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { LayoutDashboard, Building2, ShieldCheck, Users, CreditCard, LifeBuoy, Activity } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await import('next/headers').then(m => m.headers()) })
  if (!session) redirect('/auth/login')

  // Basic check for admin role (in a real app, verify against admin_users table or JWT claims)
  // For the sake of routing, we let the backend enforce security on API calls.

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-slate-900 flex flex-col hidden md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-bold text-lg">Impactis Admin</span>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="space-y-1 px-2">
            <li>
              <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </Link>
            </li>
            <li>
              <Link href="/dashboard/organizations" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                <Building2 className="h-4 w-4" />
                Organizations
              </Link>
            </li>
            <li>
              <Link href="/dashboard/users" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                <Users className="h-4 w-4" />
                Users
              </Link>
            </li>
            <li>
              <Link href="/dashboard/deal-rooms" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                <ShieldCheck className="h-4 w-4" />
                Deal Rooms
              </Link>
            </li>
            <li>
              <Link href="/dashboard/subscriptions" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                <CreditCard className="h-4 w-4" />
                Subscriptions
              </Link>
            </li>
            <li>
              <Link href="/dashboard/tickets" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                <LifeBuoy className="h-4 w-4" />
                Support Tickets
              </Link>
            </li>
            <li>
              <Link href="/dashboard/audit" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                <Activity className="h-4 w-4" />
                Audit Logs
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}
