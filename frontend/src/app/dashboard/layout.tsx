import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-black">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-gray-100">
          <span className="font-bold text-xl text-blue-600">InvoiceOS</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 text-gray-800 rounded-md hover:bg-gray-200 font-medium border border-transparent hover:border-gray-300">
            Overview
          </Link>
          <Link href="/dashboard/invoices" className="block px-3 py-2 text-gray-800 rounded-md hover:bg-gray-200 font-medium border border-transparent hover:border-gray-300">
            Invoices
          </Link>
          <Link href="/dashboard/settings" className="block px-4 py-2 mt-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">
            Settings
        </Link>
            <Link 
  href="/dashboard/reports" 
  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
  Reports
</Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex items-center bg-gray-100 p-2 rounded border border-gray-300">
            <OrganizationSwitcher 
              hidePersonal={true}
              afterCreateOrganizationUrl="/dashboard/invoices"
              afterSelectOrganizationUrl="/dashboard/invoices"
            />
          </div>
          <div className="flex items-center gap-4 bg-gray-100 p-2 rounded border border-gray-300">
            <UserButton/>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-white text-black">
          {children}
        </main>

      </div>
    </div>
  );
}