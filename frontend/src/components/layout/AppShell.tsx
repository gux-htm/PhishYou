/**
 * PhishYou — Application shell (layout route)
 * Spec: FRONTEND_SPEC_ENHANCED.md — AppShell
 *
 * Composes the fixed Header (h-16), fixed Sidebar (w-64, lg+) and the fixed
 * MobileNav (h-16, < lg) around an <Outlet/>. Pages render their own padding
 * and max-width; the shell only offsets the chrome:
 *   - pt-16 for the header
 *   - lg:pl-64 for the sidebar
 *   - pb-16 lg:pb-0 so the mobile bottom nav never covers content
 */
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#0F1219] text-[#F5F7FB]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#2FD9C7] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#0F1219]"
      >
        Skip to main content
      </a>
      <Header />
      <Sidebar />
      <main id="main-content" className="pt-16 pb-16 lg:pb-0 lg:pl-64">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}

export default AppShell;
