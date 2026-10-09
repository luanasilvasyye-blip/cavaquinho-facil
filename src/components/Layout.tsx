import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Music2, LogOut, Home, Volume2, Dumbbell, BookOpen, Timer, Package, TrendingUp } from 'lucide-react'
import { logout } from '../lib/auth'

const NAV_MAIN = [
  { to: '/app', label: 'Início', icon: Home },
  { to: '/app/acordes', label: 'Acordes', icon: Volume2 },
  { to: '/app/treinador', label: 'Treinar', icon: Dumbbell },
  { to: '/app/plano', label: 'Estudos', icon: BookOpen },
  { to: '/app/kit', label: 'Meu Kit', icon: Package }
]

const NAV_EXTRA = [
  { to: '/app/metronomo', label: 'Metrônomo', icon: Timer },
  { to: '/app/progresso', label: 'Evolução', icon: TrendingUp }
]

export function TopBar({ email, showLogout }: { email?: string | null; showLogout?: boolean }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to={email ? '/app' : '/'} className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-ink-950 shadow-glow">
            <Music2 size={20} strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-wide">CAVAQUINHO FÁCIL</span>
            <span className="block text-[11px] text-white/60">Aprenda praticando, no seu ritmo</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {email && <span className="badge max-w-[160px] truncate">{email}</span>}
          {showLogout && (
            <button
              className="btn-ghost !min-h-[40px] !px-3 !py-2 text-sm"
              onClick={async () => {
                await logout()
                nav('/acessar')
              }}
              aria-label="Sair"
            >
              <LogOut size={16} /> Sair
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export function BottomNav() {
  const loc = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-ink-950/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-5xl grid-cols-5 px-1">
        {NAV_MAIN.map((i) => {
          const active = loc.pathname === i.to
          return (
            <Link
              key={i.to}
              to={i.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2.5 text-[11px] font-bold transition ${
                active ? 'text-emerald-400' : 'text-white/60'
              }`}
            >
              <span className={`h-1 w-6 rounded-full transition ${active ? 'bg-emerald-400 shadow-glow' : 'bg-transparent'}`} />
              {i.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function Sidebar({ email }: { email?: string | null }) {
  const loc = useLocation()
  const nav = useNavigate()
  const linkCls = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
      active ? 'bg-emerald-500/15 text-emerald-300 shadow-glow' : 'text-white/65 hover:bg-white/5 hover:text-white'
    }`
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-60 flex-col border-r border-white/[0.07] bg-ink-900/80 p-4 backdrop-blur md:flex">
      <Link to="/app" className="flex items-center gap-2 px-2 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-ink-950 shadow-glow">
          <Music2 size={22} strokeWidth={2.5} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-black tracking-wide">CAVAQUINHO FÁCIL</span>
          <span className="block text-[11px] text-white/55">Área do aluno</span>
        </span>
      </Link>
      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {[...NAV_MAIN, ...NAV_EXTRA].map((i) => {
          const Icon = i.icon
          return (
            <Link key={i.to} to={i.to} className={linkCls(loc.pathname === i.to)}>
              <Icon size={18} /> {i.label}
            </Link>
          )
        })}
      </nav>
      {email && <p className="truncate px-2 text-xs text-white/50">{email}</p>}
      <button
        className="btn-ghost mt-2 w-full !min-h-[44px] text-sm"
        onClick={async () => {
          await logout()
          nav('/acessar')
        }}
      >
        <LogOut size={16} /> Sair
      </button>
    </aside>
  )
}

export function Page({ children, email, app }: { children: React.ReactNode; email?: string | null; app?: boolean }) {
  return (
    <div className="min-h-screen pb-24 md:pb-10">
      {app && <Sidebar email={email} />}
      <div className={app ? 'md:pl-60' : ''}>
        <TopBar email={email} showLogout={!!app} />
        <main className="page-enter mx-auto w-full max-w-5xl px-4 pt-5">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pt-10 text-center text-xs text-white/50">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link className="underline" to="/privacidade">Privacidade</Link>
            <Link className="underline" to="/termos">Termos</Link>
            <Link className="underline" to="/suporte">Suporte</Link>
          </div>
          <p className="mt-2">Cavaquinho Fácil — ferramenta de estudo independente. Requer internet para salvar progresso.</p>
        </footer>
      </div>
      {app && <BottomNav />}
    </div>
  )
}
