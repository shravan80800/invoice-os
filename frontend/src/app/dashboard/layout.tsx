'use client';

import { useState } from 'react';
import { UserButton, OrganizationSwitcher, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const { isLoaded, userId } = useAuth();

  const isActive = (path: string) => pathname === path;

  const NavLinks = () => (
    <>
      <Link 
        href="/dashboard" 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
          isActive('/dashboard') 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <svg className={`w-5 h-5 ${isActive('/dashboard') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Overview
      </Link>

      <Link 
        href="/dashboard/invoices" 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
          isActive('/dashboard/invoices') 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <svg className={`w-5 h-5 ${isActive('/dashboard/invoices') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Invoices
      </Link>

      <Link 
        href="/dashboard/products" 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
          isActive('/dashboard/products') 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <svg className={`w-5 h-5 ${isActive('/dashboard/products') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Products
      </Link>

      <Link 
        href="/dashboard/balance-sheet" 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
          isActive('/dashboard/balance-sheet') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <svg className={`w-5 h-5 ${isActive('/dashboard/balance-sheet') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        Ledger
      </Link>

      <Link 
        href="/dashboard/customers" 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
          isActive('/dashboard/customers') 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <svg className={`w-5 h-5 ${isActive('/dashboard/customers') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Clients
      </Link>

      <Link 
        href="/dashboard/reports" 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
          isActive('/dashboard/reports') 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <svg className={`w-5 h-5 ${isActive('/dashboard/reports') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Reports
      </Link>

      <Link 
        href="/dashboard/settings" 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
          isActive('/dashboard/settings') 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <svg className={`w-5 h-5 ${isActive('/dashboard/settings') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </Link>
    </>
  );

  return (
    // 🚀 FIX 1: Added print rules to outermost container
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* 🚀 FIX 2: Added print:hidden to hide Sidebar on paper */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl md:shadow-none flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <span className="font-bold text-xl text-slate-900 tracking-tight">Invoice<span className="text-indigo-600">OS</span></span>
          <button className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <NavLinks />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Workspace</span>
            {isLoaded && userId && (
              <OrganizationSwitcher hidePersonal={true} afterCreateOrganizationUrl="/dashboard/invoices" afterSelectOrganizationUrl="/dashboard/invoices" appearance={{ elements: { rootBox: "scale-90 origin-right" } }} />
            )}
          </div>
        </div>
      </aside>

      {/* 🚀 FIX 3: Added print rules to Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:h-auto print:overflow-visible">
        
        {/* 🚀 FIX 4: Added print:hidden to hide Top Header & Profile Pic */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10 shadow-sm print:hidden">
          
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold text-lg text-slate-900 tracking-tight md:hidden">Invoice<span className="text-indigo-600">OS</span></span>
          </div>

          <div className="hidden md:block"><h2 className="text-sm font-semibold text-slate-800">Overview</h2></div>

          <div className="flex items-center gap-4">
            <div className="p-1 border border-slate-200 rounded-full hover:shadow-md transition-shadow bg-slate-50">
              {isLoaded && userId && <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />}
            </div>
          </div>
        </header>

        {/* 🚀 FIX 5: Added print rules to scrollable area to prevent cutoff */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] print:overflow-visible print:bg-white">
          {children}
        </main>

      </div>
    </div>
  );
}