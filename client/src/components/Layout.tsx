import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-surface-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div key={location.pathname} className="page-fade">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-surface-800 py-6 text-center text-sm text-slate-500">
        Courtside — NCAA D1 Men's Volleyball Analytics • Data from{" "}
        stats.ncaa.org •{" "}
        <a
          href="https://github.com/riyonp23/CourtSide"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 transition-colors hover:text-accent"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
