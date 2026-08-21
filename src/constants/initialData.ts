import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'rh',
    nome: 'Recursos Humanos',
    cor: '#D6430E',
    descricao: 'Políticas de férias, admissão, benefícios e conduta interna',
    tutoriais: [
      {
        id: 't1',
        titulo: 'Como solicitar férias no portal',
        duracao: '4 min',
        desc: 'Passo a passo detalhado para abrir, planejar e acompanhar o pedido de férias no portal do colaborador.',
        anexo: 'https://souenergy.com.br',
        subcategoria: 'Benefícios & Folgas',
        tags: ['férias', 'folga', 'portal', 'benefícios', 'solicitação'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'RH - Equipe de Gente & Gestão',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-20T10:00:00Z',
        version: 2,
        history: [
          { timestamp: '2026-08-15T09:00:00Z', updatedBy: 'rh@souenergy.com.br', notes: 'Criação inicial do tutorial' },
          { timestamp: '2026-08-20T10:00:00Z', updatedBy: 'davi.lopes@souenergy.com.br', notes: 'Atualização das regras de antecedência de 30 dias' }
        ],
        passos: [
          'Acesse o **Portal do Colaborador** utilizando seu e-mail corporativo (`seu.nome@souenergy.com.br`) e senha cadastrada.',
          'No menu lateral esquerdo, clique na seção **Solicitações** e em seguida selecione a opção **Férias / Recesso**.',
          '> [!NOTE]\n> Certifique-se de que seu período aquisitivo está completo antes de programar as datas.',
          'Selecione a data de início e término desejada, respeitando o prazo de **aviso prévio mínimo de 30 dias úteis**.',
          'Caso opte por abono pecuniário (venda de até 1/3 das férias), marque a caixa de seleção correspondente.',
          '> [!WARNING]\n> Solicitações com menos de 30 dias de antecedência exigem autorização expressa da diretoria.',
          'Revise o resumo das datas e clique no botão **Enviar para Aprovação** do gestor direto.',
          'Acompanhe o status da aprovação diretamente na aba "Minhas Solicitações" — você receberá um e-mail de confirmação quando aprovado.'
        ]
      },
      {
        id: 't2',
        titulo: 'Onboarding e integração de novos colaboradores',
        duracao: '7 min',
        desc: 'Checklist completo que gestores e RH seguem durante a primeira semana de um novo talento.',
        subcategoria: 'Admissão & Cultura',
        tags: ['onboarding', 'novo colaborador', 'integração', 'gestor', 'boas-vindas'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'RH - Desenvolvimento Humano',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-18T14:30:00Z',
        version: 1,
        passos: [
          'O time de RH providencia o **kit de boas-vindas**, crachá e solicita os acessos à TI até 2 dias úteis antes do início.',
          'O gestor direto agenda o alinhamento de apresentação da equipe e define o padrinho (*buddy*) de integração.',
          '> [!TIP]\n> O padrinho deve acompanhar o novo colaborador no almoço do 1º dia e orientar sobre o dia a dia.',
          'No primeiro dia, o colaborador realiza o tour institucional e recebe o cronograma de treinamentos da Universidade Corporativa.',
          'Definição conjunta entre gestor e colaborador das **metas e expectativas para os primeiros 30, 60 e 90 dias**.',
          'Realização de um check-in de alinhamento com o RH ao final da primeira e quarta semana.'
        ]
      },
      {
        id: 't3',
        titulo: 'Reembolso de despesas corporativas e viagens',
        duracao: '3 min',
        desc: 'Diretrizes e fluxo para prestação de contas de quilometragem, alimentação e estadias.',
        subcategoria: 'Benefícios & Folgas',
        tags: ['reembolso', 'despesas', 'viagem', 'nota fiscal', 'prestação de contas'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Controladoria & RH',
        updatedBy: 'financeiro@souenergy.com.br',
        updatedAt: '2026-08-10T11:20:00Z',
        version: 1,
        passos: [
          'Exija e guarde sempre o **cupom ou nota fiscal eletrônica com CNPJ da Sou Energy** para cada gasto.',
          'Acesse o módulo de **Prestação de Contas** no portal corporativo.',
          'Digitalize o comprovante com foto nítida e selecione a categoria correta (Transporte, Alimentação, Hospedagem).',
          '> [!IMPORTANT]\n> O limite diário de refeição fora da sede segue a tabela da política de viagens vigente.',
          'Submeta o relatório até o 5º dia útil do mês seguinte à despesa para pagamento no ciclo corrente.'
        ]
      }
    ]
  },
  {
    id: 'fin',
    nome: 'Financeiro & Controladoria',
    cor: '#171717',
    descricao: 'Emissão de notas fiscais, contas a pagar, conciliação e relatórios fiscais',
    tutoriais: [
      {
        id: 't4',
        titulo: 'Emissão de Nota Fiscal de Serviços e Produtos',
        duracao: '5 min',
        desc: 'Fluxo oficial para emissão correta de NF-e e NFS-e para clientes e parceiros.',
        subcategoria: 'Faturamento',
        tags: ['nota fiscal', 'nfe', 'nfse', 'faturamento', 'impostos'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Equipe Fiscal',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-19T16:00:00Z',
        version: 3,
        passos: [
          'Acesse o sistema ERP com suas credenciais do setor financeiro.',
          'Vá até o menu **Faturamento > Emitir Nota Fiscal**.',
          'Valide a razão social, CNPJ e inscrição estadual do cliente antes de gerar a prévia.',
          'Insira os códigos fiscais de operação (CFOP) e confirme as alíquotas de tributação destacadas.',
          '> [!WARNING]\n> Notas com retenção de ISS ou PIS/COFINS precisam de conferência dupla com o contrato.',
          'Gere a prévia em PDF para conferência visual dos valores e dados de cobrança.',
          'Autorize o envio junto à SEFAZ / Prefeitura e envie o XML e DANFE automaticamente para o cliente.'
        ]
      },
      {
        id: 't5',
        titulo: 'Fluxo de aprovação de pagamentos a fornecedores',
        duracao: '6 min',
        desc: 'Procedimento para cadastro de boletos, conferência de pedidos de compra e liberação bancária.',
        subcategoria: 'Contas a Pagar',
        tags: ['pagamento', 'fornecedor', 'aprovação', 'boleto', 'remessa'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Contas a Pagar',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-17T09:15:00Z',
        version: 2,
        passos: [
          'O solicitante anexa o boleto, DANFE e o pedido de compra aprovado no sistema de pagamentos.',
          'O sistema classifica automaticamente a alçada de aprovação de acordo com a matriz de poderes.',
          'O gestor do centro de custo recebe a notificação e valida o recebimento do serviço ou material.',
          '> [!NOTE]\n> Pagamentos acima de R$ 50.000,00 exigem aprovação da Diretoria Financeira.',
          'Após todas as assinaturas digitais, o financeiro inclui o título na remessa bancária do dia acordado.',
          'O comprovante é arquivado digitalmente vinculado ao processo de compra.'
        ]
      },
      {
        id: 't6',
        titulo: 'Rotina de fechamento contábil e conciliação de caixa',
        duracao: '8 min',
        desc: 'Instruções para conferência de extratos, lançamentos pendentes e consolidação mensal.',
        subcategoria: 'Contabilidade',
        tags: ['fechamento', 'conciliação', 'contabilidade', 'bancos', 'mensal'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Controladoria',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-12T17:00:00Z',
        version: 1,
        passos: [
          'Importe os arquivos OFX de todas as contas bancárias correntes e contas de investimento até o último dia do mês.',
          'Execute a rotina de auto-conciliação e trate manualmente divergências de tarifas ou juros.',
          'Verifique contas transitórias de clientes e fornecedores para certificar saldo zero.',
          'Emita o balancete de verificação e compare com o orçamento planejado.',
          'Envie o relatório consolidado para a auditoria até o 4º dia útil do mês subsequente.'
        ]
      }
    ]
  },
  {
    id: 'ti',
    nome: 'Tecnologia da Informação',
    cor: '#FF8C42',
    descricao: 'Infraestrutura, acessos a sistemas, segurança da informação e VPN',
    tutoriais: [
      {
        id: 't7',
        titulo: 'Abertura e acompanhamento de chamados no Helpdesk',
        duracao: '2 min',
        desc: 'Como abrir solicitações de suporte para computadores, impressoras, softwares e rede.',
        subcategoria: 'Suporte ao Usuário',
        tags: ['helpdesk', 'suporte', 'chamado', 'computador', 'ti', 'problema'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Suporte TI',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-20T08:00:00Z',
        version: 2,
        passos: [
          'Acesse a plataforma de Helpdesk pelo link oficial da TI ou atalho na intranet.',
          'Escolha a categoria que melhor representa sua dúvida ou problema (Hardware, Acessos, E-mail, Rede).',
          'Defina a prioridade de acordo com o impacto no seu trabalho (Baixa, Média, Alta, Crítica).',
          '> [!TIP]\n> Adicione capturas de tela (*prints*) da mensagem de erro para acelerar a resolução técnica.',
          'Clique em **Registrar Chamado** e anote o número de protocolo gerado.',
          'Você receberá notificações por e-mail a cada interação do analista de TI.'
        ]
      },
      {
        id: 't8',
        titulo: 'Configuração de VPN segura e Acesso Remoto',
        duracao: '5 min',
        desc: 'Instruções passo a passo para conectar com segurança aos servidores e ERP da Sou Energy de casa.',
        subcategoria: 'Segurança & Rede',
        tags: ['vpn', 'acesso remoto', 'home office', 'segurança', 'rede'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Segurança da Informação',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-19T11:00:00Z',
        version: 4,
        passos: [
          'Baixe e instale o cliente de VPN homologado pela Sou Energy no portal de downloads da TI.',
          'Abra o aplicativo e insira o endereço do gateway fornecido pela equipe de segurança.',
          'Digite seu usuário de rede (`nome.sobrenome`) e sua senha corporativa.',
          '> [!IMPORTANT]\n> A autenticação em 2 fatores (2FA) no aplicativo do celular é obrigatória para conectar.',
          'Abra o app autenticador no seu smartphone e digite o código de 6 dígitos temporário.',
          'Assim que o status mudar para **Conectado (Verde)**, seus sistemas internos estarão disponíveis com tráfego criptografado.'
        ]
      },
      {
        id: 't9',
        titulo: 'Política de senhas fortes e autenticação em dois fatores (MFA)',
        duracao: '3 min',
        desc: 'Boas práticas obrigatórias de segurança digital e proteção de contas corporativas.',
        subcategoria: 'Segurança & Rede',
        tags: ['senha', '2fa', 'mfa', 'segurança', 'política', 'lgpd'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Segurança da Informação',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-15T15:00:00Z',
        version: 2,
        passos: [
          'Crie senhas com no mínimo **12 caracteres**, contendo letras maiúsculas, minúsculas, números e caracteres especiais.',
          '> [!WARNING]\n> É terminantemente proibido compartilhar credenciais ou anotá-las em papéis visíveis.',
          'Nunca reutilize a mesma senha de contas pessoais em ferramentas da empresa.',
          'Ative a confirmação em 2 etapas em todas as plataformas que suportam a funcionalidade.',
          'Caso suspeite de vazamento ou atividade estranha, comunique imediatamente a TI pelo canal de segurança.'
        ]
      }
    ]
  },
  {
    id: 'op',
    nome: 'Operações & Engenharia',
    cor: '#7A7A7A',
    descricao: 'Procedimentos de campo, checklists de vistoria, segurança do trabalho e logística',
    tutoriais: [
      {
        id: 't10',
        titulo: 'Checklist de abertura e vistoria de unidade',
        duracao: '4 min',
        desc: 'Procedimento diário de segurança patrimonial, conferência de equipamentos e validação operacional.',
        subcategoria: 'Instalações & Campo',
        tags: ['checklist', 'abertura', 'vistoria', 'unidade', 'operação'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Coordenação de Operações',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-14T07:30:00Z',
        version: 1,
        passos: [
          'Desarme o sistema de alarme e verifique se as câmeras do perímetro estão operacionais.',
          'Cheque o quadro de energia principal e confirme se não há disjuntores desarmados.',
          'Inspecione os estoques de segurança e equipamentos de proteção individual (EPIs).',
          'Ligue os terminais de atendimento e verifique a conexão com o servidor central.',
          'Preencha o formulário eletrônico diário de abertura e anexe fotos se encontrar alguma irregularidade.'
        ]
      },
      {
        id: 't11',
        titulo: 'Procedimentos de Segurança do Trabalho e Uso de EPIs',
        duracao: '5 min',
        desc: 'Normas de prevenção de acidentes para equipes de galpão, transporte e instalações fotovoltaicas.',
        subcategoria: 'Segurança do Trabalho (SESMT)',
        tags: ['segurança', 'epi', 'nr10', 'nr35', 'trabalho em altura', 'sesmt'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'SESMT',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-16T10:00:00Z',
        version: 2,
        passos: [
          'Inspecione seu kit de EPI antes de iniciar qualquer atividade (Capacete, Luvas dielétricas, Botinas com bico de composite e Óculos de proteção).',
          '> [!WARNING]\n> Para trabalhos em altura superior a 2 metros (NR-35), é mandatório o uso de cinto tipo paraquedista com trava-quedas e linha de vida.',
          'Realize a Análise Preliminar de Risco (APR) junto com o líder da equipe antes de energizar qualquer circuito.',
          'Delimite e sinalize a área de trabalho com cones e fita zebrada.',
          'Em caso de quase-acidente ou condição insegura, interrompa o serviço imediatamente e comunique o técnico de segurança.'
        ]
      }
    ]
  },
  {
    id: 'cs',
    nome: 'Atendimento & Sucesso do Cliente',
    cor: '#FF5A1F',
    descricao: 'Padrões de comunicação, gestão de SLAs, escalonamento e pós-venda',
    tutoriais: [
      {
        id: 't12',
        titulo: 'Padrão de Atendimento via Chat e WhatsApp Corporativo',
        duracao: '4 min',
        desc: 'Diretrizes de tom de voz, agilidade e excelência no relacionamento com parceiros e clientes.',
        subcategoria: 'Canais de Atendimento',
        tags: ['atendimento', 'chat', 'whatsapp', 'cliente', 'sucesso do cliente'],
        obsoleto: false,
        visualizacoes: 0,
        author: 'Customer Experience',
        updatedBy: 'davi.lopes@souenergy.com.br',
        updatedAt: '2026-08-18T16:45:00Z',
        version: 2,
        passos: [
          'Cumprimente o cliente com cordialidade e profissionalismo, informando seu nome e setor.',
          'Confirme os dados cadastrais da usina ou pedido para garantir a segurança da informação.',
          'Ouça/leia atentamente toda a solicitação antes de enviar respostas pré-fabricadas.',
          '> [!TIP]\n> Seja objetivo e empático. Se precisar de tempo para pesquisar, informe ao cliente uma previsão em minutos.',
          'Registre o resumo do contato no CRM e vincule ao protocolo do cliente.',
          'Finalize perguntando se há mais alguma dúvida e envie a pesquisa de satisfação (*NPS*).'
        ]
      }
    ]
  }
];

export const DEFAULT_ONBOARDING_TRACKS: Array<{
  id: string;
  titulo: string;
  descricao: string;
  departamento: string;
  cor: string;
  tutorialIds: string[];
}> = [
  {
    id: 'track-geral',
    titulo: 'Integração Geral & Boas-Vindas Sou Energy',
    descricao: 'Tutoriais essenciais para os primeiros 7 dias de qualquer novo colaborador na empresa.',
    departamento: 'Geral / Todos',
    cor: '#FF5A1F',
    tutorialIds: ['t2', 't1', 't4', 't7']
  },
  {
    id: 'track-operacoes',
    titulo: 'Trilha de Operações & Campo',
    descricao: 'Procedimentos mandatórios de segurança, abertura de unidade e manuseio de infraestrutura.',
    departamento: 'Operações & Logística',
    cor: '#D6430E',
    tutorialIds: ['t11', 't10', 't4']
  },
  {
    id: 'track-atendimento',
    titulo: 'Trilha de Atendimento & Relacionamento',
    descricao: 'Padrão de excelência no atendimento aos parceiros integradores e clientes finais.',
    departamento: 'Sucesso do Cliente & Comercial',
    cor: '#EA580C',
    tutorialIds: ['t12', 't7', 't9']
  },
  {
    id: 'track-ti',
    titulo: 'Trilha de Segurança Digital & Acessos de TI',
    descricao: 'Configuração de VPN segura, políticas de senhas e abertura de chamados.',
    departamento: 'Tecnologia da Informação',
    cor: '#C2410C',
    tutorialIds: ['t4', 't5', 't6']
  }
];

