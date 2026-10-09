import { Page } from '../components/Layout'

export function Privacidade() {
  return (
    <Page>
      <h1 className="text-2xl font-black">Política de Privacidade</h1>
      <div className="card mt-4 space-y-3 text-sm leading-relaxed text-white/80">
        <p><strong>Última atualização:</strong> outubro de 2026.</p>
        <p><strong>1. O que coletamos.</strong> E-mail da compra e identificador da transação Hotmart (armazenado como hash HMAC, nunca em texto puro no banco acessível). Dados de estudo: dias concluídos e sessões de prática. Eventos anônimos de uso (visita, clique em demo/compra) sem rastreadores de terceiros.</p>
        <p><strong>2. Para que usamos.</strong> Liberar e manter seu acesso após confirmação de pagamento; salvar seu progresso; auditar webhooks; melhorar o conteúdo.</p>
        <p><strong>3. O que NÃO fazemos.</strong> Não vendemos dados, não exibimos dados de outros alunos, não usamos cookies de terceiros para publicidade dentro do app.</p>
        <p><strong>4. Base e direitos (LGPD).</strong> Tratamos dados para execução do contrato (seu acesso) e legítimo interesse (segurança/antifraude). Você pode pedir acesso, correção e exclusão pelo suporte.</p>
        <p><strong>5. Segurança.</strong> Sessão em cookie HttpOnly/Secure/SameSite assinado no servidor; chaves privilegiadas só nas Netlify Functions; RLS no Supabase negando leitura pública de dados privados.</p>
        <p><strong>6. Retenção.</strong> Mantemos compras e auditoria enquanto o acesso existir ou por obrigação legal; após reembolso/chargeback, o acesso é revogado e a sessão invalidada.</p>
        <p><strong>7. Contato.</strong> Use a página de suporte.</p>
      </div>
    </Page>
  )
}

export function Termos() {
  return (
    <Page>
      <h1 className="text-2xl font-black">Termos de Uso</h1>
      <div className="card mt-4 space-y-3 text-sm leading-relaxed text-white/80">
        <p><strong>1. O produto.</strong> Cavaquinho Fácil é uma ferramenta interativa de estudo (acordes, treinador, plano de 7 dias, metrônomo e progresso), vendida em pagamento único de R$ 19,90 via Hotmart.</p>
        <p><strong>2. Acesso.</strong> Liberado somente após confirmação de pagamento via webhook oficial da Hotmart. O login usa e-mail da compra + código da transação. É proibido compartilhar acesso.</p>
        <p><strong>3. Reembolso e revogação.</strong> Reembolsos seguem as regras da Hotmart. Após reembolso, chargeback ou cancelamento confirmados, o acesso é revogado.</p>
        <p><strong>4. Expectativas honestas.</strong> O plano de 7 dias cria a base (acordes limpos, trocas e tempo estável); não promete proficiência profissional em 7 dias. Resultados dependem de prática regular.</p>
        <p><strong>5. Requisitos.</strong> Navegador moderno com Web Audio API e conexão com a internet para salvar progresso. O áudio é sintetizado localmente; qualidade varia por aparelho.</p>
        <p><strong>6. Conduta.</strong> Sem tentativas de burlar acesso, webhooks ou limites de login. Tentativas repetidas podem bloquear temporariamente o acesso.</p>
      </div>
    </Page>
  )
}

export function Suporte({ email }: { email?: string }) {
  const fromEnv = ((import.meta as any).env?.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || ''
  const supportEmail = (email ?? fromEnv).trim()
  return (
    <Page>
      <h1 className="text-2xl font-black">Suporte</h1>
      <div className="card mt-4 space-y-3 text-sm text-white/80">
        {supportEmail ? (
          <p><strong>Fale conosco:</strong> <a className="text-emerald-300 underline" href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60">
            E-mail de suporte ainda não configurado neste ambiente. Defina VITE_SUPPORT_EMAIL para exibir o contato oficial.
          </p>
        )}
        <p><strong>Comprei e não consigo entrar:</strong></p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Aguarde alguns minutos após a aprovação — o webhook precisa confirmar o pagamento.</li>
          <li>Confira o e-mail digitado (o mesmo da compra) e o código da transação do comprovante.</li>
          <li>Tente novamente. Após 5 tentativas erradas em 15 minutos, aguarde antes de tentar de novo.</li>
          <li>Se o pagamento foi aprovado há mais de 1 hora e nada funciona, fale com o suporte informando: e-mail da compra, data e os 4 últimos dígitos da transação (nunca envie o código completo por canal inseguro se preferir — o atendente pedirá conferência).</li>
        </ol>
        <p><strong>Restaurar acesso (procedimento administrativo):</strong> o administrador confere a venda no painel Hotmart (produto, e-mail, transação, status pago) e usa a chave ADMIN_RESTORE_KEY na função admin-grant para liberar manualmente. Tudo fica registrado em auditoria.</p>
        <p><strong>Problemas de som:</strong> use Chrome ou Edge atualizados, tire do modo silencioso no celular e permita áudio no navegador.</p>
      </div>
    </Page>
  )
}
