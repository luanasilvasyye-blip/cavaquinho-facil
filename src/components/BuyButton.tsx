import { CHECKOUT_URL, isCheckoutConfigured } from '../lib/auth'
import { track } from '../lib/analytics'

/** Botão de compra Hotmart (mesmo checkout de R$ 19,90, sem página de vendas aqui). */
export function BuyButton({ large }: { large?: boolean }) {
  const configured = isCheckoutConfigured()
  const onClick = () => track('click_buy', { configured: String(configured) })
  if (!configured) {
    return (
      <div className="card border-gold/40">
        <p className="font-bold text-gold-light">Checkout em configuração</p>
        <p className="mt-1 text-sm text-white/70">
          O produto está em configuração no ambiente de desenvolvimento. Defina HOTMART_CHECKOUT_URL para liberar a compra.
        </p>
      </div>
    )
  }
  return (
    <a href={CHECKOUT_URL} onClick={onClick} className={large ? 'btn-primary w-full text-xl' : 'btn-primary w-full'}>
      Quero meu acesso por R$ 19,90
    </a>
  )
}
