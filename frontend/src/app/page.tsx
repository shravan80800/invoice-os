import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          Invoice OS
        </div>
        <Link 
          href="/dashboard"
          className="text-sm font-semibold hover:text-blue-600 transition-colors"
        >
          Go to Dashboard &rarr;
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-blue-700 bg-blue-100/50 mb-8 border border-blue-200">
          <span>🚀 Production-Ready Architecture</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 text-zinc-900">
          Manage your invoices with absolute <span className="text-blue-600">simplicity.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-600 mb-10 max-w-2xl leading-relaxed">
          A modern, multi-tenant invoicing platform engineered for speed. Track revenue, manage customers, and stay on top of outstanding payments securely.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
          >
            Open Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-xl bg-white border border-zinc-200 px-8 text-base font-semibold text-zinc-900 transition-all hover:bg-zinc-50"
          >
            View Documentation
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-zinc-400">
        <p>© {new Date().getFullYear()} Invoice OS. All rights reserved.</p>
      </footer>
    </div>
  );
}