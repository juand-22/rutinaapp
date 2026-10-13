import { NavLink, Outlet } from "react-router-dom";
import { ListIcon, NoteIcon } from "./Icons";

const navItems = [
  { to: "/", label: "Tareas", icon: ListIcon, end: true },
  { to: "/notas", label: "Notas", icon: NoteIcon, end: false },
];

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9ff] dark:bg-[#0f0d1a]">
      {/* Contenido principal */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="mx-auto max-w-lg px-4 pb-4">
          <div className="flex items-center justify-around bg-white dark:bg-[#1a1726] rounded-2xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 p-1.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                      : "text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? "scale-110" : ""
                      }`}
                    />
                    <span className="text-[11px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
