import { Link } from 'react-router-dom'
import { Music2, KeyRound, Play, MailCheck } from 'lucide-react'
import { Page } from '../components/Layout'

// Boas-vindas do aplicativo (sem vendas: sem preço, oferta ou depoimento).
export default function Welcome() {
  return (
    <Page>
      <section className="page-enter mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center py-10 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-ink-950 shadow-glow">
          <Music2 size={40} strokeWidth={2.5} />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Cavaquinho Fácil</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
          Sua plataforma de estudos
        </h1>
        <p className="mt-3 text-base text-white/70">
          Acordes com som real, treinador de trocas, plano de 7 dias, metrônomo e kit de apoio — tudo no seu ritmo.
        </p>

        <div className="mt-8 grid w-full gap-2">
          <Link to="/acessar" className="btn-primary w-full">
            <KeyRound size={19} /> Acessar meu aplicativo
          </Link>
          <Link to="/demo" className="btn-ghost w-full">
            <Play size={18} /> Experimentar demonstração
          </Link>
        </div>

        <div className="card mt-8 w-full text-left">
          <p className="flex items-center gap-2 font-black">
            <MailCheck size={18} className="text-emerald-400" /> Como acesso o produto?
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-white/70">
            <li>Conclua sua compra na página oficial.</li>
            <li>Aguarde a confirmação do pagamento.</li>
            <li>Entre com o e-mail da compra e o código da transação do comprovante.</li>
          </ol>
          <a
            href="https://cavaquinho-facil.lovable.app/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-emerald-300 underline"
          >
            Ir para a página oficial
          </a>
        </div>
      </section>
    </Page>
  )
}
