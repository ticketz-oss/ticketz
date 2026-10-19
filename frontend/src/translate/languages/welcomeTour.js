const steps = s => ({
  agent: { title: s[0][0], description: s[0][1] },
  newTicket: { title: s[1][0], description: s[1][1] },
  dashboard: { title: s[2][0], description: s[2][1] },
  tickets: { title: s[3][0], description: s[3][1] },
  chats: { title: s[4][0], description: s[4][1] },
  tasks: { title: s[5][0], description: s[5][1] },
  contacts: { title: s[6][0], description: s[6][1] },
  tags: { title: s[7][0], description: s[7][1] },
  campaigns: { title: s[8][0], description: s[8][1] },
  schedules: { title: s[9][0], description: s[9][1] },
  prospeccao: { title: s[10][0], description: s[10][1] },
  flows: { title: s[11][0], description: s[11][1] },
  queues: { title: s[12][0], description: s[12][1] },
  chatgpt: { title: s[13][0], description: s[13][1] },
  quickMessages: { title: s[14][0], description: s[14][1] },
  connections: { title: s[15][0], description: s[15][1] },
  users: { title: s[16][0], description: s[16][1] },
  announcements: { title: s[17][0], description: s[17][1] },
  financeiro: { title: s[18][0], description: s[18][1] },
  cobranca: { title: s[19][0], description: s[19][1] },
  settings: { title: s[20][0], description: s[20][1] },
  helps: { title: s[21][0], description: s[21][1] },
  theme: { title: s[22][0], description: s[22][1] },
  profile: { title: s[23][0], description: s[23][1] }
});

const pt = {
  welcomeTour: {
    manga: {
      convite:
        "Zzz... Opa! Cheguei antes de você. Seu espaço está prontinho para ser montado. Posso?",
      convidar: "Monta aí, Luiza!",
      falas: [
        "Deixa comigo!",
        "Primeiro, a central de atendimento...",
        "Agora o menu da sua equipe...",
        "Quase lá... quase...",
        "..."
      ],
      sfx: ["TUM!", "TUM!", "TRRR!", "BA-DUM!"],
      grito: "TCHARAM!",
      pronto:
        "{{company}} está no ar e o seu teste grátis começou! Quer que eu te mostre cada cantinho da barra lateral? É rapidinho.",
      deVolta:
        "Oi de novo! Ainda quer que eu te mostre a barra lateral? É rapidinho.",
      sim: "Bora, me mostra!",
      nao: "Agora não",
      dica: "Dá para refazer o tour quando quiser, pelo menu do seu perfil."
    },
    invite: {
      title: "Seu espaço está quase pronto",
      description: "Falta só um toque para montar tudo para {{company}}.",
      question:
        "Eu sou a Luiza, sua parceira por aqui. Vamos montar o seu espaço juntos?",
      action: "Montar meu espaço"
    },
    intro: {
      title: "Oi! Eu sou a Luiza",
      description:
        "Sou a agente do Espaço Whats e a sua parceira por aqui. Vou te mostrar a barra lateral, área por área. Use Próximo para seguir comigo."
    },
    build: {
      title: "Montando o seu espaço",
      description:
        "Só um instante. Estamos deixando tudo no lugar para {{company}}.",
      steps: [
        "Criando a central de atendimento",
        "Organizando o menu da equipe",
        "Aplicando a sua marca",
        "Liberando o teste grátis"
      ]
    },
    modal: {
      title: "Parabéns, seu espaço está pronto!",
      description:
        "{{company}} já está no ar e o seu teste grátis começou agora.",
      question:
        "Quer um tour rápido pela barra lateral para ver para que serve cada área? Leva cerca de 1 minuto.",
      start: "Fazer o tour",
      skip: "Agora não",
      hint: "Você pode refazer o tour quando quiser pelo menu do seu perfil."
    },
    menu: "Tour pela barra lateral",
    progress: "{{current}} de {{total}}",
    next: "Próximo",
    previous: "Voltar",
    done: "Concluir",
    finish: {
      title: "Tudo pronto para começar",
      description:
        "Próximo passo: conecte seu número em Conexões. A partir daí, as conversas dos clientes chegam em Atendimentos."
    },
    steps: steps([
      [
        "Agente Espaço",
        "Essa sou eu, a Luiza! Me chame quando quiser consultar atendimentos, tarefas e números da operação."
      ],
      [
        "Abrir atendimento",
        "Comece uma conversa com um contato pelo WhatsApp."
      ],
      [
        "Visão geral",
        "Os números do dia: atendimentos em andamento, aguardando, concluídos e tempos médios."
      ],
      [
        "Atendimentos",
        "Todas as conversas com clientes. Aceite, responda, transfira e encerre por aqui."
      ],
      ["Chat interno", "Converse com a sua equipe sem sair do Espaço Whats."],
      [
        "Tarefas",
        "Quadro de tarefas da equipe, com responsáveis, filas e prazos."
      ],
      ["Contatos", "Sua base de clientes, com etiquetas e campos adicionais."],
      ["Tags", "Etiquetas coloridas para organizar contatos e atendimentos."],
      [
        "Campanhas",
        "Envie mensagens para listas de contatos, com intervalos entre os envios."
      ],
      [
        "Agendamentos",
        "Programe mensagens, aniversários e datas comemorativas."
      ],
      ["Prospecção", "Encontre novos clientes e prepare a primeira abordagem."],
      [
        "Fluxos e automação",
        "Monte o chatbot com blocos de mensagem, menu, mídia e transferência."
      ],
      [
        "Filas e chatbot",
        "Organize setores, atendentes, horários e mensagens de boas-vindas."
      ],
      ["ChatGPT", "Conecte o ChatGPT e outros agentes externos ao seu espaço."],
      ["Respostas rápidas", "Atalhos de texto para responder mais rápido."],
      ["Conexões", "Conecte seus números de WhatsApp. Comece por aqui."],
      ["Usuários", "Convide atendentes e defina o que cada um pode acessar."],
      [
        "Informativos",
        "Publique avisos para toda a equipe ou para filas específicas."
      ],
      ["Financeiro", "Faturas e assinatura do seu espaço."],
      ["Central de cobrança", "Clientes, planos e faturas da operação."],
      [
        "Configurações",
        "Preferências gerais, horários, marca e tela de login."
      ],
      ["Ajuda", "Tutoriais e vídeos para tirar dúvidas."],
      ["Tema", "Alterne entre o tema claro e o escuro."],
      ["Seu perfil", "Dados da conta, idioma, refazer este tour e sair."]
    ])
  }
};

const ptPT = {
  welcomeTour: {
    ...pt.welcomeTour,
    manga: {
      convite:
        "Zzz... Opa! Cheguei antes de si. O seu espaço está prontinho para ser montado. Posso?",
      convidar: "Monta lá, Luiza!",
      falas: [
        "Deixe comigo!",
        "Primeiro, a central de atendimento...",
        "Agora o menu da sua equipa...",
        "Quase lá... quase...",
        "..."
      ],
      sfx: ["TUM!", "TUM!", "TRRR!", "BA-DUM!"],
      grito: "TCHARAM!",
      pronto:
        "{{company}} está no ar e o seu teste gratuito começou! Quer que lhe mostre cada cantinho da barra lateral? É rapidinho.",
      deVolta:
        "Olá outra vez! Ainda quer que lhe mostre a barra lateral? É rapidinho.",
      sim: "Vamos, mostre-me!",
      nao: "Agora não",
      dica: "Pode repetir a visita quando quiser, no menu do seu perfil."
    },
    invite: {
      title: "O seu espaço está quase pronto",
      description: "Falta só um toque para montar tudo para {{company}}.",
      question:
        "Eu sou a Luiza, a sua parceira por aqui. Vamos montar o seu espaço juntos?",
      action: "Montar o meu espaço"
    },
    intro: {
      title: "Olá! Eu sou a Luiza",
      description:
        "Sou a agente do Espaço Whats e a sua parceira por aqui. Vou mostrar-lhe a barra lateral, área a área. Use Próximo para seguir comigo."
    },
    build: {
      title: "A montar o seu espaço",
      description:
        "Só um instante. Estamos a deixar tudo pronto para {{company}}.",
      steps: [
        "A criar a central de atendimento",
        "A organizar o menu da equipa",
        "A aplicar a sua marca",
        "A libertar o teste gratuito"
      ]
    },
    modal: {
      ...pt.welcomeTour.modal,
      description:
        "{{company}} já está ativo e o seu teste gratuito começou agora.",
      question:
        "Quer uma visita rápida à barra lateral para ver para que serve cada área? Demora cerca de 1 minuto.",
      start: "Fazer a visita",
      hint: "Pode repetir a visita quando quiser no menu do seu perfil."
    },
    menu: "Visita à barra lateral",
    steps: {
      ...pt.welcomeTour.steps,
      agent: {
        title: "Agente Espaço",
        description:
          "Esta sou eu, a Luiza! Chame-me quando quiser consultar atendimentos, tarefas e números da operação."
      }
    },
    finish: {
      title: "Tudo pronto para começar",
      description:
        "Próximo passo: ligue o seu número em Conexões. A partir daí, as conversas dos clientes chegam a Atendimentos."
    }
  }
};

const en = {
  welcomeTour: {
    manga: {
      convite:
        "Zzz... Oh! I got here before you. Your space is ready to be set up. Shall I?",
      convidar: "Go ahead, Luiza!",
      falas: [
        "Leave it to me!",
        "First, the service desk...",
        "Now your team's menu...",
        "Almost there... almost...",
        "..."
      ],
      sfx: ["BOOM!", "BOOM!", "BRRR!", "BA-DUM!"],
      grito: "TA-DA!",
      pronto:
        "{{company}} is live and your free trial has started! Want me to show you every corner of the sidebar? It's quick.",
      deVolta: "Hi again! Still want me to show you the sidebar? It's quick.",
      sim: "Yes, show me!",
      nao: "Not now",
      dica: "You can replay the tour anytime from your profile menu."
    },
    invite: {
      title: "Your space is almost ready",
      description: "Just one click to set everything up for {{company}}.",
      question:
        "I'm Luiza, your partner here. Shall we set up your space together?",
      action: "Set up my space"
    },
    intro: {
      title: "Hi! I'm Luiza",
      description:
        "I'm the Espaço Whats agent and your partner here. I'll show you the sidebar, one area at a time. Press Next to follow me."
    },
    build: {
      title: "Setting up your space",
      description:
        "Just a moment. We are putting everything in place for {{company}}.",
      steps: [
        "Creating your service desk",
        "Organizing the team menu",
        "Applying your brand",
        "Unlocking your free trial"
      ]
    },
    modal: {
      title: "Congratulations, your space is ready!",
      description: "{{company}} is live and your free trial has started.",
      question:
        "Want a quick tour of the sidebar to see what each area is for? It takes about a minute.",
      start: "Take the tour",
      skip: "Not now",
      hint: "You can replay the tour anytime from your profile menu."
    },
    menu: "Sidebar tour",
    progress: "{{current}} of {{total}}",
    next: "Next",
    previous: "Back",
    done: "Finish",
    finish: {
      title: "You're all set",
      description:
        "Next step: connect your number in Connections. From then on, customer conversations arrive in Tickets."
    },
    steps: steps([
      [
        "Space Agent",
        "That's me, Luiza! Call me whenever you want to check tickets, tasks and operation numbers."
      ],
      ["Open ticket", "Start a WhatsApp conversation with a contact."],
      [
        "Overview",
        "Today's numbers: ongoing, waiting and closed tickets and average times."
      ],
      [
        "Tickets",
        "Every customer conversation. Accept, reply, transfer and close them here."
      ],
      ["Internal chat", "Talk to your team without leaving the app."],
      ["Tasks", "Your team's task board, with owners, queues and due dates."],
      ["Contacts", "Your customer base, with tags and custom fields."],
      ["Tags", "Colored labels to organize contacts and tickets."],
      [
        "Campaigns",
        "Send messages to contact lists, with intervals between sends."
      ],
      ["Schedules", "Schedule messages, birthdays and special dates."],
      ["Prospecting", "Find new customers and prepare the first approach."],
      [
        "Flows and automation",
        "Build the chatbot with message, menu, media and transfer blocks."
      ],
      [
        "Queues and chatbot",
        "Organize departments, agents, hours and welcome messages."
      ],
      ["ChatGPT", "Connect ChatGPT and other external agents to your space."],
      ["Quick replies", "Text shortcuts to reply faster."],
      ["Connections", "Connect your WhatsApp numbers. Start here."],
      ["Users", "Invite agents and choose what each one can access."],
      ["Announcements", "Post notices to the whole team or specific queues."],
      ["Billing", "Invoices and subscription for your space."],
      ["Billing center", "Customers, plans and invoices of the operation."],
      ["Settings", "General preferences, hours, branding and login screen."],
      ["Help", "Tutorials and videos to answer your questions."],
      ["Theme", "Switch between light and dark theme."],
      [
        "Your profile",
        "Account details, language, replay this tour and log out."
      ]
    ])
  }
};

const es = {
  welcomeTour: {
    manga: {
      convite:
        "Zzz... ¡Uy! Llegué antes que tú. Tu espacio está listo para armarse. ¿Puedo?",
      convidar: "¡Ármalo, Luiza!",
      falas: [
        "¡Déjamelo a mí!",
        "Primero, la central de atención...",
        "Ahora el menú de tu equipo...",
        "Casi... casi...",
        "..."
      ],
      sfx: ["¡PUM!", "¡PUM!", "¡TRRR!", "¡BA-DUM!"],
      grito: "¡TACHÁN!",
      pronto:
        "¡{{company}} ya está activo y tu prueba gratis comenzó! ¿Te muestro cada rincón de la barra lateral? Es rapidito.",
      deVolta:
        "¡Hola de nuevo! ¿Todavía quieres que te muestre la barra lateral? Es rapidito.",
      sim: "¡Dale, muéstrame!",
      nao: "Ahora no",
      dica: "Puedes repetir el recorrido cuando quieras desde el menú de tu perfil."
    },
    invite: {
      title: "Tu espacio está casi listo",
      description: "Solo falta un clic para armar todo para {{company}}.",
      question: "Soy Luiza, tu compañera aquí. ¿Armamos tu espacio juntos?",
      action: "Armar mi espacio"
    },
    intro: {
      title: "¡Hola! Soy Luiza",
      description:
        "Soy la agente de Espaço Whats y tu compañera aquí. Te mostraré la barra lateral, área por área. Usa Siguiente para seguirme."
    },
    build: {
      title: "Armando tu espacio",
      description: "Un momento. Estamos dejando todo listo para {{company}}.",
      steps: [
        "Creando la central de atención",
        "Organizando el menú del equipo",
        "Aplicando tu marca",
        "Liberando la prueba gratis"
      ]
    },
    modal: {
      title: "¡Felicitaciones, tu espacio está listo!",
      description: "{{company}} ya está activo y tu prueba gratis comenzó.",
      question:
        "¿Quieres un recorrido rápido por la barra lateral para ver para qué sirve cada área? Toma cerca de 1 minuto.",
      start: "Hacer el recorrido",
      skip: "Ahora no",
      hint: "Puedes repetir el recorrido cuando quieras desde el menú de tu perfil."
    },
    menu: "Recorrido por la barra lateral",
    progress: "{{current}} de {{total}}",
    next: "Siguiente",
    previous: "Atrás",
    done: "Terminar",
    finish: {
      title: "Todo listo para empezar",
      description:
        "Próximo paso: conecta tu número en Conexiones. Desde entonces, las conversaciones de clientes llegan a Atenciones."
    },
    steps: steps([
      [
        "Agente Espacio",
        "¡Esa soy yo, Luiza! Llámame cuando quieras consultar atenciones, tareas y números de la operación."
      ],
      [
        "Abrir atención",
        "Inicia una conversación con un contacto por WhatsApp."
      ],
      [
        "Visión general",
        "Los números del día: atenciones en curso, en espera, concluidas y tiempos medios."
      ],
      [
        "Atenciones",
        "Todas las conversaciones con clientes. Acepta, responde, transfiere y cierra aquí."
      ],
      ["Chat interno", "Habla con tu equipo sin salir de la aplicación."],
      [
        "Tareas",
        "Tablero de tareas del equipo, con responsables, colas y plazos."
      ],
      ["Contactos", "Tu base de clientes, con etiquetas y campos adicionales."],
      [
        "Etiquetas",
        "Etiquetas de colores para organizar contactos y atenciones."
      ],
      [
        "Campañas",
        "Envía mensajes a listas de contactos, con intervalos entre envíos."
      ],
      ["Agendamientos", "Programa mensajes, cumpleaños y fechas especiales."],
      [
        "Prospección",
        "Encuentra nuevos clientes y prepara el primer contacto."
      ],
      [
        "Flujos y automatización",
        "Arma el chatbot con bloques de mensaje, menú, medios y transferencia."
      ],
      [
        "Colas y chatbot",
        "Organiza sectores, agentes, horarios y mensajes de bienvenida."
      ],
      ["ChatGPT", "Conecta ChatGPT y otros agentes externos a tu espacio."],
      ["Respuestas rápidas", "Atajos de texto para responder más rápido."],
      ["Conexiones", "Conecta tus números de WhatsApp. Empieza por aquí."],
      ["Usuarios", "Invita agentes y define a qué puede acceder cada uno."],
      [
        "Informativos",
        "Publica avisos para todo el equipo o colas específicas."
      ],
      ["Finanzas", "Facturas y suscripción de tu espacio."],
      ["Central de cobros", "Clientes, planes y facturas de la operación."],
      [
        "Configuración",
        "Preferencias generales, horarios, marca y pantalla de inicio de sesión."
      ],
      ["Ayuda", "Tutoriales y videos para resolver dudas."],
      ["Tema", "Cambia entre el tema claro y el oscuro."],
      [
        "Tu perfil",
        "Datos de la cuenta, idioma, repetir este recorrido y salir."
      ]
    ])
  }
};

const fr = {
  welcomeTour: {
    manga: {
      convite:
        "Zzz... Oh ! Je suis arrivée avant vous. Votre espace est prêt à être monté. Je peux ?",
      convidar: "Vas-y, Luiza !",
      falas: [
        "Laissez-moi faire !",
        "D’abord, le centre de service...",
        "Maintenant le menu de l’équipe...",
        "Presque... presque...",
        "..."
      ],
      sfx: ["BOUM !", "BOUM !", "BRRR !", "BA-DOUM !"],
      grito: "TADAM !",
      pronto:
        "{{company}} est en ligne et votre essai gratuit a commencé ! Je vous montre chaque coin de la barre latérale ? C’est rapide.",
      deVolta:
        "Re-bonjour ! Toujours partant pour la visite de la barre latérale ? C’est rapide.",
      sim: "Oui, montre-moi !",
      nao: "Pas maintenant",
      dica: "Vous pouvez relancer la visite depuis le menu de votre profil."
    },
    invite: {
      title: "Votre espace est presque prêt",
      description: "Un seul clic pour tout préparer pour {{company}}.",
      question:
        "Je suis Luiza, votre partenaire ici. On prépare votre espace ensemble ?",
      action: "Préparer mon espace"
    },
    intro: {
      title: "Salut ! Je suis Luiza",
      description:
        "Je suis l’agente d’Espaço Whats et votre partenaire ici. Je vais vous montrer la barre latérale, zone par zone. Cliquez sur Suivant pour me suivre."
    },
    build: {
      title: "Préparation de votre espace",
      description: "Un instant. Nous mettons tout en place pour {{company}}.",
      steps: [
        "Création du centre de service",
        "Organisation du menu de l’équipe",
        "Application de votre marque",
        "Activation de votre essai gratuit"
      ]
    },
    modal: {
      title: "Félicitations, votre espace est prêt !",
      description:
        "{{company}} est en ligne et votre essai gratuit a commencé.",
      question:
        "Voulez-vous une visite rapide de la barre latérale pour voir à quoi sert chaque zone ? Cela prend environ 1 minute.",
      start: "Faire la visite",
      skip: "Pas maintenant",
      hint: "Vous pouvez relancer la visite à tout moment depuis le menu de votre profil."
    },
    menu: "Visite de la barre latérale",
    progress: "{{current}} sur {{total}}",
    next: "Suivant",
    previous: "Retour",
    done: "Terminer",
    finish: {
      title: "Tout est prêt",
      description:
        "Prochaine étape : connectez votre numéro dans Connexions. Ensuite, les conversations clients arrivent dans Tickets."
    },
    steps: steps([
      [
        "Agent Espace",
        "C’est moi, Luiza ! Appelez-moi pour consulter les tickets, les tâches et les chiffres de l’opération."
      ],
      [
        "Ouvrir un ticket",
        "Démarrez une conversation WhatsApp avec un contact."
      ],
      [
        "Vue d'ensemble",
        "Les chiffres du jour : tickets en cours, en attente, terminés et temps moyens."
      ],
      [
        "Tickets",
        "Toutes les conversations clients. Acceptez, répondez, transférez et clôturez ici."
      ],
      [
        "Chat interne",
        "Discutez avec votre équipe sans quitter l'application."
      ],
      [
        "Tâches",
        "Le tableau des tâches de l'équipe, avec responsables, files et échéances."
      ],
      [
        "Contacts",
        "Votre base clients, avec étiquettes et champs personnalisés."
      ],
      [
        "Étiquettes",
        "Des étiquettes de couleur pour organiser contacts et tickets."
      ],
      [
        "Campagnes",
        "Envoyez des messages à des listes de contacts, avec des intervalles."
      ],
      [
        "Planifications",
        "Programmez des messages, anniversaires et dates spéciales."
      ],
      [
        "Prospection",
        "Trouvez de nouveaux clients et préparez la première approche."
      ],
      [
        "Flux et automatisation",
        "Construisez le chatbot avec des blocs message, menu, média et transfert."
      ],
      [
        "Files et chatbot",
        "Organisez services, agents, horaires et messages d'accueil."
      ],
      [
        "ChatGPT",
        "Connectez ChatGPT et d'autres agents externes à votre espace."
      ],
      ["Réponses rapides", "Des raccourcis de texte pour répondre plus vite."],
      ["Connexions", "Connectez vos numéros WhatsApp. Commencez ici."],
      [
        "Utilisateurs",
        "Invitez des agents et choisissez ce que chacun peut voir."
      ],
      [
        "Annonces",
        "Publiez des avis pour toute l'équipe ou des files précises."
      ],
      ["Finances", "Factures et abonnement de votre espace."],
      ["Centre de facturation", "Clients, offres et factures de l'opération."],
      [
        "Paramètres",
        "Préférences générales, horaires, marque et écran de connexion."
      ],
      ["Aide", "Tutoriels et vidéos pour répondre à vos questions."],
      ["Thème", "Basculez entre le thème clair et sombre."],
      ["Votre profil", "Compte, langue, relancer cette visite et déconnexion."]
    ])
  }
};

const de = {
  welcomeTour: {
    manga: {
      convite:
        "Zzz... Oh! Ich war vor Ihnen da. Ihr Bereich ist bereit zum Aufbau. Darf ich?",
      convidar: "Leg los, Luiza!",
      falas: [
        "Überlassen Sie das mir!",
        "Zuerst die Servicezentrale...",
        "Jetzt das Menü Ihres Teams...",
        "Fast... fast...",
        "..."
      ],
      sfx: ["BUMM!", "BUMM!", "BRRR!", "BA-DUMM!"],
      grito: "TADAA!",
      pronto:
        "{{company}} ist online und Ihre Testphase hat begonnen! Soll ich Ihnen jede Ecke der Seitenleiste zeigen? Geht ganz schnell.",
      deVolta:
        "Hallo nochmal! Soll ich Ihnen noch die Seitenleiste zeigen? Geht ganz schnell.",
      sim: "Ja, zeig es mir!",
      nao: "Jetzt nicht",
      dica: "Sie können die Tour jederzeit über Ihr Profilmenü wiederholen."
    },
    invite: {
      title: "Ihr Bereich ist fast bereit",
      description: "Nur ein Klick, um alles für {{company}} einzurichten.",
      question:
        "Ich bin Luiza, Ihre Partnerin hier. Richten wir Ihren Bereich gemeinsam ein?",
      action: "Meinen Bereich einrichten"
    },
    intro: {
      title: "Hallo! Ich bin Luiza",
      description:
        "Ich bin die Agentin von Espaço Whats und Ihre Partnerin hier. Ich zeige Ihnen die Seitenleiste, Bereich für Bereich. Klicken Sie auf Weiter, um mir zu folgen."
    },
    build: {
      title: "Ihr Bereich wird eingerichtet",
      description: "Einen Moment. Wir richten alles für {{company}} ein.",
      steps: [
        "Servicezentrale wird erstellt",
        "Teammenü wird organisiert",
        "Ihre Marke wird angewendet",
        "Kostenlose Testphase wird freigeschaltet"
      ]
    },
    modal: {
      title: "Glückwunsch, Ihr Bereich ist bereit!",
      description:
        "{{company}} ist online und Ihre kostenlose Testphase hat begonnen.",
      question:
        "Möchten Sie eine kurze Tour durch die Seitenleiste, um zu sehen, wofür jeder Bereich da ist? Sie dauert etwa 1 Minute.",
      start: "Tour starten",
      skip: "Jetzt nicht",
      hint: "Sie können die Tour jederzeit über Ihr Profilmenü wiederholen."
    },
    menu: "Tour durch die Seitenleiste",
    progress: "{{current}} von {{total}}",
    next: "Weiter",
    previous: "Zurück",
    done: "Fertig",
    finish: {
      title: "Alles bereit",
      description:
        "Nächster Schritt: Verbinden Sie Ihre Nummer unter Verbindungen. Danach kommen Kundengespräche in Tickets an."
    },
    steps: steps([
      [
        "Space-Agent",
        "Das bin ich, Luiza! Rufen Sie mich, um Tickets, Aufgaben und Kennzahlen abzufragen."
      ],
      ["Ticket öffnen", "Starten Sie ein WhatsApp-Gespräch mit einem Kontakt."],
      [
        "Übersicht",
        "Die Zahlen des Tages: laufende, wartende, abgeschlossene Tickets und Durchschnittszeiten."
      ],
      [
        "Tickets",
        "Alle Kundengespräche. Annehmen, antworten, weiterleiten und schließen."
      ],
      [
        "Interner Chat",
        "Sprechen Sie mit Ihrem Team, ohne die App zu verlassen."
      ],
      [
        "Aufgaben",
        "Aufgabenboard des Teams mit Verantwortlichen, Warteschlangen und Fristen."
      ],
      ["Kontakte", "Ihre Kundenbasis mit Tags und Zusatzfeldern."],
      ["Tags", "Farbige Labels, um Kontakte und Tickets zu ordnen."],
      [
        "Kampagnen",
        "Senden Sie Nachrichten an Kontaktlisten, mit Pausen zwischen den Sendungen."
      ],
      ["Planungen", "Planen Sie Nachrichten, Geburtstage und besondere Daten."],
      [
        "Akquise",
        "Finden Sie neue Kunden und bereiten Sie die erste Ansprache vor."
      ],
      [
        "Flows und Automatisierung",
        "Bauen Sie den Chatbot aus Nachricht-, Menü-, Medien- und Weiterleitungsblöcken."
      ],
      [
        "Warteschlangen und Chatbot",
        "Organisieren Sie Abteilungen, Agenten, Zeiten und Begrüßungen."
      ],
      ["ChatGPT", "Verbinden Sie ChatGPT und andere externe Agenten."],
      ["Schnellantworten", "Textkürzel, um schneller zu antworten."],
      [
        "Verbindungen",
        "Verbinden Sie Ihre WhatsApp-Nummern. Beginnen Sie hier."
      ],
      ["Benutzer", "Laden Sie Agenten ein und legen Sie ihre Zugriffe fest."],
      [
        "Mitteilungen",
        "Veröffentlichen Sie Hinweise für das ganze Team oder einzelne Warteschlangen."
      ],
      ["Finanzen", "Rechnungen und Abonnement Ihres Bereichs."],
      ["Abrechnungszentrale", "Kunden, Tarife und Rechnungen des Betriebs."],
      [
        "Einstellungen",
        "Allgemeine Einstellungen, Zeiten, Marke und Anmeldeseite."
      ],
      ["Hilfe", "Anleitungen und Videos für Ihre Fragen."],
      ["Design", "Wechseln Sie zwischen hellem und dunklem Design."],
      ["Ihr Profil", "Konto, Sprache, diese Tour wiederholen und abmelden."]
    ])
  }
};

const it = {
  welcomeTour: {
    manga: {
      convite:
        "Zzz... Oh! Sono arrivata prima di te. Il tuo spazio è pronto da montare. Posso?",
      convidar: "Vai, Luiza!",
      falas: [
        "Lascia fare a me!",
        "Prima, la centrale assistenza...",
        "Ora il menu del tuo team...",
        "Quasi... quasi...",
        "..."
      ],
      sfx: ["BUM!", "BUM!", "BRRR!", "BA-DUM!"],
      grito: "TADAN!",
      pronto:
        "{{company}} è online e la tua prova gratuita è iniziata! Vuoi che ti mostri ogni angolo della barra laterale? Faccio in fretta.",
      deVolta:
        "Ciao di nuovo! Vuoi ancora che ti mostri la barra laterale? Faccio in fretta.",
      sim: "Sì, fammi vedere!",
      nao: "Non ora",
      dica: "Puoi rifare il tour quando vuoi dal menu del tuo profilo."
    },
    invite: {
      title: "Il tuo spazio è quasi pronto",
      description: "Basta un clic per preparare tutto per {{company}}.",
      question:
        "Sono Luiza, la tua partner qui. Prepariamo insieme il tuo spazio?",
      action: "Prepara il mio spazio"
    },
    intro: {
      title: "Ciao! Sono Luiza",
      description:
        "Sono l’agente di Espaço Whats e la tua partner qui. Ti mostro la barra laterale, un’area alla volta. Premi Avanti per seguirmi."
    },
    build: {
      title: "Stiamo preparando il tuo spazio",
      description: "Un attimo. Stiamo mettendo tutto a posto per {{company}}.",
      steps: [
        "Creazione della centrale assistenza",
        "Organizzazione del menu del team",
        "Applicazione del tuo marchio",
        "Attivazione della prova gratuita"
      ]
    },
    modal: {
      title: "Congratulazioni, il tuo spazio è pronto!",
      description: "{{company}} è online e la tua prova gratuita è iniziata.",
      question:
        "Vuoi un tour veloce della barra laterale per vedere a cosa serve ogni area? Richiede circa 1 minuto.",
      start: "Fai il tour",
      skip: "Non ora",
      hint: "Puoi rifare il tour quando vuoi dal menu del tuo profilo."
    },
    menu: "Tour della barra laterale",
    progress: "{{current}} di {{total}}",
    next: "Avanti",
    previous: "Indietro",
    done: "Fine",
    finish: {
      title: "Tutto pronto",
      description:
        "Prossimo passo: collega il tuo numero in Connessioni. Da lì le conversazioni dei clienti arrivano in Ticket."
    },
    steps: steps([
      [
        "Agente Spazio",
        "Sono io, Luiza! Chiamami quando vuoi consultare ticket, attività e numeri dell’operazione."
      ],
      ["Apri ticket", "Avvia una conversazione WhatsApp con un contatto."],
      [
        "Panoramica",
        "I numeri del giorno: ticket in corso, in attesa, chiusi e tempi medi."
      ],
      [
        "Ticket",
        "Tutte le conversazioni con i clienti. Accetta, rispondi, trasferisci e chiudi qui."
      ],
      ["Chat interna", "Parla con il tuo team senza uscire dall'app."],
      [
        "Attività",
        "La bacheca delle attività del team, con responsabili, code e scadenze."
      ],
      ["Contatti", "La tua base clienti, con tag e campi aggiuntivi."],
      ["Tag", "Etichette colorate per organizzare contatti e ticket."],
      [
        "Campagne",
        "Invia messaggi a liste di contatti, con intervalli tra gli invii."
      ],
      ["Pianificazioni", "Programma messaggi, compleanni e date speciali."],
      ["Prospezione", "Trova nuovi clienti e prepara il primo contatto."],
      [
        "Flussi e automazione",
        "Costruisci il chatbot con blocchi messaggio, menu, media e trasferimento."
      ],
      [
        "Code e chatbot",
        "Organizza reparti, operatori, orari e messaggi di benvenuto."
      ],
      ["ChatGPT", "Collega ChatGPT e altri agenti esterni al tuo spazio."],
      ["Risposte rapide", "Scorciatoie di testo per rispondere più in fretta."],
      ["Connessioni", "Collega i tuoi numeri WhatsApp. Inizia da qui."],
      ["Utenti", "Invita operatori e decidi cosa può vedere ciascuno."],
      ["Avvisi", "Pubblica avvisi per tutto il team o per code specifiche."],
      ["Finanze", "Fatture e abbonamento del tuo spazio."],
      ["Centro fatturazione", "Clienti, piani e fatture dell'operazione."],
      [
        "Impostazioni",
        "Preferenze generali, orari, marchio e schermata di accesso."
      ],
      ["Aiuto", "Tutorial e video per chiarire i dubbi."],
      ["Tema", "Passa dal tema chiaro a quello scuro."],
      ["Il tuo profilo", "Account, lingua, rifare questo tour ed esci."]
    ])
  }
};

const id = {
  welcomeTour: {
    manga: {
      convite:
        "Zzz... Oh! Aku datang lebih dulu. Ruang Anda siap dirakit. Boleh?",
      convidar: "Ayo, Luiza!",
      falas: [
        "Serahkan padaku!",
        "Pertama, pusat layanan...",
        "Sekarang menu tim Anda...",
        "Hampir... hampir...",
        "..."
      ],
      sfx: ["DUM!", "DUM!", "BRRR!", "BA-DUM!"],
      grito: "TADA!",
      pronto:
        "{{company}} sudah aktif dan uji coba gratis Anda dimulai! Mau kutunjukkan setiap sudut bilah samping? Cepat kok.",
      deVolta: "Hai lagi! Masih mau kutunjukkan bilah samping? Cepat kok.",
      sim: "Ayo, tunjukkan!",
      nao: "Nanti saja",
      dica: "Anda bisa mengulang tur kapan saja dari menu profil."
    },
    invite: {
      title: "Ruang Anda hampir siap",
      description:
        "Tinggal satu klik untuk menyiapkan semuanya bagi {{company}}.",
      question:
        "Saya Luiza, partner Anda di sini. Kita siapkan ruang Anda bersama?",
      action: "Siapkan ruang saya"
    },
    intro: {
      title: "Hai! Saya Luiza",
      description:
        "Saya agen Espaço Whats dan partner Anda di sini. Saya akan menunjukkan bilah samping, satu per satu. Tekan Berikutnya untuk mengikuti saya."
    },
    build: {
      title: "Menyiapkan ruang Anda",
      description:
        "Sebentar. Kami sedang menyiapkan semuanya untuk {{company}}.",
      steps: [
        "Membuat pusat layanan",
        "Menata menu tim",
        "Menerapkan merek Anda",
        "Membuka uji coba gratis"
      ]
    },
    modal: {
      title: "Selamat, ruang Anda sudah siap!",
      description:
        "{{company}} sudah aktif dan uji coba gratis Anda telah dimulai.",
      question:
        "Mau tur singkat di bilah samping untuk melihat fungsi setiap area? Hanya sekitar 1 menit.",
      start: "Mulai tur",
      skip: "Nanti saja",
      hint: "Anda bisa mengulang tur kapan saja dari menu profil."
    },
    menu: "Tur bilah samping",
    progress: "{{current}} dari {{total}}",
    next: "Berikutnya",
    previous: "Kembali",
    done: "Selesai",
    finish: {
      title: "Semua siap",
      description:
        "Langkah berikutnya: hubungkan nomor Anda di Koneksi. Setelah itu, percakapan pelanggan masuk ke Tiket."
    },
    steps: steps([
      [
        "Agen Ruang",
        "Itu saya, Luiza! Panggil saya kapan saja untuk melihat tiket, tugas, dan angka operasional."
      ],
      ["Buka tiket", "Mulai percakapan WhatsApp dengan kontak."],
      [
        "Ringkasan",
        "Angka hari ini: tiket berjalan, menunggu, selesai, dan waktu rata-rata."
      ],
      [
        "Tiket",
        "Semua percakapan pelanggan. Terima, balas, alihkan, dan tutup di sini."
      ],
      ["Obrolan internal", "Berbicara dengan tim tanpa keluar dari aplikasi."],
      [
        "Tugas",
        "Papan tugas tim, dengan penanggung jawab, antrean, dan tenggat."
      ],
      ["Kontak", "Basis pelanggan Anda, dengan tag dan kolom tambahan."],
      ["Tag", "Label berwarna untuk mengatur kontak dan tiket."],
      [
        "Kampanye",
        "Kirim pesan ke daftar kontak, dengan jeda antar pengiriman."
      ],
      ["Jadwal", "Jadwalkan pesan, ulang tahun, dan tanggal khusus."],
      ["Prospek", "Temukan pelanggan baru dan siapkan pendekatan pertama."],
      [
        "Alur dan otomatisasi",
        "Bangun chatbot dengan blok pesan, menu, media, dan pengalihan."
      ],
      [
        "Antrean dan chatbot",
        "Atur departemen, agen, jam kerja, dan pesan sambutan."
      ],
      ["ChatGPT", "Hubungkan ChatGPT dan agen eksternal lain ke ruang Anda."],
      ["Balasan cepat", "Pintasan teks untuk membalas lebih cepat."],
      ["Koneksi", "Hubungkan nomor WhatsApp Anda. Mulai dari sini."],
      ["Pengguna", "Undang agen dan tentukan akses masing-masing."],
      [
        "Pengumuman",
        "Terbitkan pemberitahuan untuk seluruh tim atau antrean tertentu."
      ],
      ["Keuangan", "Tagihan dan langganan ruang Anda."],
      ["Pusat penagihan", "Pelanggan, paket, dan tagihan operasional."],
      ["Pengaturan", "Preferensi umum, jam kerja, merek, dan layar masuk."],
      ["Bantuan", "Tutorial dan video untuk menjawab pertanyaan."],
      ["Tema", "Beralih antara tema terang dan gelap."],
      ["Profil Anda", "Akun, bahasa, ulangi tur ini, dan keluar."]
    ])
  }
};

export const welcomeTourMessages = {
  pt,
  pt_PT: ptPT,
  en,
  es,
  fr,
  de,
  it,
  id
};
