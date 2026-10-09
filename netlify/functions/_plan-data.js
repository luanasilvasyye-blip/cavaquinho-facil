// Conteúdo completo do plano de 7 dias — SERVIDOR APENAS.
// Este arquivo NÃO é empacotado no bundle público: é servido via
// GET /.netlify/functions/lessons somente com sessão válida.
// Conteúdo original preservado verbatim (mesmo texto do app).
export const STUDY_PLAN = [
  {
    day: 1,
    title: 'Conhecendo o cavaquinho',
    goal: 'Identificar as partes, afinar em Ré–Sol–Si–Ré e produzir o primeiro som limpo.',
    minutes: 20,
    steps: [
      {
        title: 'Partes e postura',
        body: [
          'O cavaquinho tem 4 cordas duplas na versão acústica, mas no aplicativo estudamos as 4 alturas: 4ª Ré (grave), 3ª Sol, 2ª Si e 1ª Ré (aguda).',
          'Sente-se com a coluna reta, apoie o instrumento no colo e mantenha o braço relaxado. O polegar da mão esquerda fica atrás do braço, sem apertar.',
          'A mão direita segura a palheta com firmeza leve, atacando as cordas sobre a boca do instrumento.'
        ],
        exercise: 'Toque cada corda solta 8 vezes, devagar, ouvindo se o som sai limpo e sem trastejar.',
        minutes: 8
      },
      {
        title: 'Afinação Ré–Sol–Si–Ré',
        body: [
          'Confira a afinação com um afinador cromático: D4, G4, B4, D5. Ajuste sempre de baixo para cima até chegar na nota.',
          'Cordas novas desafinam rápido nos primeiros dias — isso é normal. Confira antes de cada estudo.'
        ],
        chordIds: ['G'],
        exercise: 'Toque o acorde Sol com todas as cordas soltas e memorize o som de referência do instrumento afinado.',
        minutes: 6
      },
      {
        title: 'Primeira batida para baixo',
        body: [
          'Com a palheta, faça movimentos curtos para baixo atravessando as 4 cordas. O pulso vem do punho, não do braço inteiro.',
          'Conte “1, 2, 3, 4” em voz alta enquanto toca, um ataque por tempo, em andamento confortável.'
        ],
        exercise: '4 séries de 4 tempos no acorde Sol. Descanse 30 segundos entre séries.',
        minutes: 6
      }
    ]
  },
  {
    day: 2,
    title: 'Primeiros acordes',
    goal: 'Formar Sol, Sol7 e Dó com som limpo.',
    minutes: 25,
    steps: [
      {
        title: 'Sol e Sol7',
        body: [
          'Sol maior usa todas as cordas soltas: o som mais fácil do cavaquinho.',
          'Sol7 acrescenta o dedo 3 na 1ª corda, casa 3 (nota Fá). Esse acorde aparece em quase todo samba.'
        ],
        chordIds: ['G', 'G7'],
        exercise: 'Alterne 4 vezes Sol → Sol7 → Sol, tocando 4 batidas em cada. Ouça com o botão “Ouvir acorde”.',
        minutes: 10
      },
      {
        title: 'Dó maior',
        body: [
          'Dó: 4ª corda casa 2 (Mi), 3ª solta (Sol), 2ª casa 1 (Dó), 1ª casa 2 (Mi).',
          'Pressione com a ponta dos dedos, perto do traste, sem encostar nas cordas vizinhas.'
        ],
        chordIds: ['C'],
        exercise: 'Forme Dó, toque corda por corda e corrija qualquer som abafado. Repita 6 vezes.',
        minutes: 8
      },
      {
        title: 'Fixação',
        body: ['Pequenas sessões diárias valem mais que uma sessão longa por semana. Se doer a ponta dos dedos, pause e volte amanhã.'],
        exercise: 'Toque a sequência Sol (4 tempos) → Dó (4 tempos) 4 vezes seguidas.',
        minutes: 7
      }
    ]
  },
  {
    day: 3,
    title: 'Posição correta das mãos',
    goal: 'Eliminar sons abafados com ajuste fino de dedos e palheta.',
    minutes: 20,
    steps: [
      {
        title: 'Mão esquerda',
        body: [
          'Dedos curvados, unhas curtas, pressão mínima necessária. O polegar sustenta sem fazer força.',
          'Teste: forme Dó e toque cada corda isolada. Se alguma não soar, ajuste o ângulo do dedo vizinho.'
        ],
        chordIds: ['C', 'D', 'Dm'],
        exercise: 'Diagnóstico corda por corda em Dó, Ré e Ré menor. Anote qual dedo precisa de ajuste.',
        minutes: 10
      },
      {
        title: 'Mão direita',
        body: [
          'Palheta inclinada levemente, ataque constante. Evite “pescar” cordas individuais no início.',
          'Mantenha o ritmo com o pé marcando o tempo junto ao metrônomo em 60 BPM.'
        ],
        exercise: 'Com o metrônomo em 60 BPM no compasso 4/4, toque Sol por 2 minutos sem parar.',
        minutes: 10
      }
    ]
  },
  {
    day: 4,
    title: 'Troca entre acordes',
    goal: 'Trocar de acorde sem perder o pulso, usando o Treinador.',
    minutes: 25,
    steps: [
      {
        title: 'Troca econômica',
        body: [
          'Antecipe o movimento: solte a pressão no último tempo, mas mantenha os dedos próximos às cordas.',
          'Procure dedos-pivô: entre Ré e Ré menor, quase tudo fica igual — muda só a 1ª corda (casa 4 → casa 3).'
        ],
        chordIds: ['D', 'Dm'],
        exercise: 'No Treinador, selecione Ré ↔ Ré menor, 60 segundos, troca a cada 4 segundos. Registre quantas trocas completou.',
        minutes: 12
      },
      {
        title: 'Troca Sol ↔ Dó',
        body: [
          'Essa troca exige reposicionar 3 dedos. Treine em câmera lenta: forme Sol, visualize Dó, mova todos juntos.',
          'Não pare a mão direita: mesmo que o acorde saia imperfeito, mantenha o ritmo.'
        ],
        chordIds: ['G', 'C'],
        exercise: 'Treinador: Sol ↔ Dó, 90 segundos. Meta inicial: 10 trocas limpas.',
        minutes: 13
      }
    ]
  },
  {
    day: 5,
    title: 'Ritmo e batidas',
    goal: 'Manter tempo estável e tocar o levada básica do samba em andamento lento.',
    minutes: 25,
    steps: [
      {
        title: 'Metrônomo é espelho',
        body: [
          'Comece em 60–70 BPM no 2/4, que é o compasso do samba. A primeira batida (aguda) marca o “1”.',
          'Se errar, não recomece do zero: volte no próximo “1”.'
        ],
        exercise: 'Metrônomo 65 BPM 2/4 por 3 minutos tocando Sol. Depois suba para 75 BPM.',
        minutes: 10
      },
      {
        title: 'Levada simples',
        body: [
          'Padrão inicial: baixo–baixo–cima–baixo–cima (em semicolcheias lentas). Diga “tum-tum-tá-tum-tá” junto.',
          'Troque de acorde somente no tempo 1, nunca no meio da levada no início.'
        ],
        chordIds: ['G', 'G7', 'C'],
        exercise: 'Sequência Sol (2 compassos) → Sol7 (2) → Dó (2) em 70 BPM.',
        minutes: 15
      }
    ]
  },
  {
    day: 6,
    title: 'Progressões simples',
    goal: 'Tocar duas progressões completas de 2 acordes com virada.',
    minutes: 25,
    steps: [
      {
        title: 'Progressão Sol → Dó',
        body: [
          'Sol por 1 compasso, Dó por 1 compasso. Essa movimentação V–I invertida aparece em introduções.',
          'Ouça a diferença: Sol7 pede resolução; Sol simples descansa.'
        ],
        chordIds: ['G', 'G7', 'C'],
        exercise: 'Toque G | G7 | C | C em loop, 70 BPM, 5 minutos.',
        minutes: 12
      },
      {
        title: 'Progressão Ré → Sol',
        body: [
          'Ré maior (tônica) indo para Sol (subdominante). Use D7 antes do Sol para criar tensão típica do samba.',
          'Ré: 4ª solta, 3ª casa 2, 2ª casa 3, 1ª casa 4. D7: mesma base, mas 2ª casa 1 e 1ª casa 4.'
        ],
        chordIds: ['D', 'D7', 'G'],
        exercise: 'Toque D (2 tempos) → D7 (2 tempos) → G (4 tempos) em loop, 5 minutos.',
        minutes: 13
      }
    ]
  },
  {
    day: 7,
    title: 'Prática final',
    goal: 'Juntar tudo em uma prática de 20 minutos e planejar a próxima semana.',
    minutes: 30,
    steps: [
      {
        title: 'Aquecimento',
        body: ['Revisite cada acorde da biblioteca uma vez, ouvindo e conferindo o diagrama.'],
        chordIds: ['G', 'G7', 'C', 'D', 'Dm'],
        exercise: '1 minuto por acorde, som limpo corda por corda.',
        minutes: 5
      },
      {
        title: 'Prática completa',
        body: [
          'Roteiro: 5 min metrônomo 70 BPM em Sol → 5 min trocas Ré↔Ré menor → 5 min progressão D–D7–G → 5 min progressão G–G7–C.',
          'Grave-se com o celular para ouvir depois: o ouvido externo percebe o que a mão não percebe na hora.'
        ],
        exercise: 'Execute o roteiro de 20 minutos e registre a sessão no Treinador e no Progresso.',
        minutes: 20
      },
      {
        title: 'Próximos passos',
        body: [
          'Você ainda não toca “profissionalmente” — e tudo bem. Em 7 dias o objetivo real é: afinar, formar 5+ acordes limpos, trocar sem travar e manter 70 BPM.',
          'Na próxima semana, repita o ciclo subindo 5 BPM por dia e adicionando Mi, Mi menor, Lá e Lá menor.'
        ],
        chordIds: ['E', 'Em', 'A', 'Am'],
        exercise: 'Conclua o Dia 7 no aplicativo e escolha a próxima atividade sugerida no Progresso.',
        minutes: 5
      }
    ]
  }
]
