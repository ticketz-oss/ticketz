const messages = {
  id: {
    translations: {
      visual: {
        visualizar: "Lihat",
        centralAtendimento: "Support center",
        alternarNavegacao: "Toggle navigation",
        trilha: "Breadcrumb",
        ferramentas: "Tools and notices",
        acoes: "Actions",
        colunas: "Visible columns",
        selecionarPagina: "Select all on this page",
        selecionar: "Select {{nome}}",
        selecionados: "{{count}} selected",
        limpar: "Clear selection",
        carregando: "Loading…",
        semResultados: "No results found.",
        exibindo: "Showing {{count}} of {{total}}",
        anterior: "Previous page",
        proxima: "Next page",
        descricaoContatos:
          "Contacts, groups and custom information used in flows and campaigns.",
        importar: "Import",
        novoContato: "New contact",
        nomeTelefone: "Name / phone",
        tipo: "Type",
        etiquetas: "Tags",
        acoesContato: "Actions for {{nome}}",
        editar: "Edit",
        excluir: "Delete",
        atualizar: "Refresh list",
        exportar: "Export",
        buscarContatos: "Search name, phone or email",
        fila: "Queue",
        saudacao: "Greeting message",
        automacao: "Automation",
        editarFila: "Edit queue {{nome}}",
        novaFila: "New queue",
        novoEnvio: "New campaign",
        campanhas: "Campaigns and messages",
        campanha: "Campaign",
        emAndamento: "In progress",
        agendadas: "Scheduled",
        concluidas: "Completed",
        inativas: "Inactive",
        canceladas: "Cancelled",
        campanhasPagina: "Campaigns on this page",
        relatorio: "View report",
        pausar: "Pause campaign",
        retomar: "Resume campaign",
        confirmacao: "Confirmation",
        habilitada: "Enabled",
        desabilitada: "Disabled",
        semAgendamento: "Not scheduled",
        naoConcluida: "Not completed",
        publico: "Audience",
        conexao: "Connection",
        resumo: "Overview",
        aoVivo: "Live",
        desempenho: "Performance",
        filasAgora: "Live queues",
        distribuicaoFilas: "Open conversations by queue.",
        atendentes: "Agents",
        periodo: "Period",
        redimensionar: "Resize panels",
        buscarAtendimentos: "Search name, phone or ticket number",
        contexto: "Context",
        detalhesContato: "Contact details",
        fluxosDescricao:
          "Design conversation paths and configure support using connected blocks.",
        canvas: "Canvas",
        editor: "Flow editor",
        versaoPublicada: "Published",
        campanhasDescricao:
          "Create broadcasts, track campaigns and organize scheduled messages.",
        suporte: "Support",
        blocos: "Blocks",
        filtrar: "Filter"
      },
      envios: {
        titulo: "Campaigns and messages",
        massivo: "Bulk messages",
        agendamentos: "Scheduled messages",
        publicos: "Audiences and lists",
        configuracao: "Delivery settings"
      },
      contexto: {
        segmentos: "Contact types",
        grupos: "Groups",
        titulo: "Context",
        contato: "Contact",
        atendimento: "Ticket",
        historico: "History",
        carregando: "Loading history…",
        erroHistorico: "Could not load the history.",
        semHistorico: "No previous tickets available.",
        semFila: "No queue",
        verConversa: "View conversation",
        protocolo: "Ticket",
        responsavel: "Assigned to",
        fila: "Queue"
      },
      centralConfig: {
        secoes: "Settings sections",
        atendimento: "Support",
        equipe: "Team and resources",
        canais: "Channels and integrations",
        administracao: "Administration",
        voltar: "Back to settings",
        itens: {
          filas: {
            titulo: "Support queues",
            descricao: "Organize teams, channels and opening hours."
          },
          fluxos: {
            titulo: "Conversation flows",
            descricao: "Connect blocks and test each conversation path."
          },
          horarios: {
            titulo: "Opening hours",
            descricao: "Define schedules, exceptions and team availability."
          },
          mensagens: {
            titulo: "Quick replies",
            descricao: "Reusable responses and agent shortcuts."
          },
          aparencia: {
            titulo: "Customize appearance",
            descricao: "Organization colors, logos, banners and login page."
          },
          opcoes: {
            titulo: "Support rules",
            descricao: "Ratings, transfers, timeouts and chatbot policies."
          },
          usuarios: {
            titulo: "Team members",
            descricao: "Manage users, permissions and assigned queues."
          },
          ajuda: {
            titulo: "Help center",
            descricao: "Publish guidance and content for your team."
          },
          conexoes: {
            titulo: "Communication channels",
            descricao: "Connect and manage your support accounts."
          },
          integracoes: {
            titulo: "ChatGPT and integrations",
            descricao: "Connect ChatGPT and manage authorized access."
          },
          voz: {
            titulo: "Voice channel",
            descricao: "Manage voice settings and connections."
          },
          empresas: {
            titulo: "Organizations",
            descricao: "Manage organizations on the platform."
          },
          planos: {
            titulo: "Plans and features",
            descricao: "Set limits and available features for each plan."
          },
          parceiros: {
            titulo: "Partners",
            descricao: "Manage partner operations and access."
          },
          pagamentos: {
            titulo: "Payment providers",
            descricao: "Configure platform billing providers."
          },
          traducoes: {
            titulo: "Languages and translations",
            descricao: "Customize platform text and languages."
          }
        }
      },
      fluxos: {
        titulo: "Flows and automation",
        editor: "Flow editor",
        canvas: "Canvas",
        blocos: "Blocks",
        conversa: "Conversation",
        atendimento: "Support",
        fechar: "Close",
        entrada: "Block input",
        saida: "Block output",
        pausado: "Paused",
        semMensagem: "Configure the message in the inspector",
        nomeBloco: "Option name",
        tipoBloco: "Block type",
        mensagem: "Message",
        variaveis:
          "Variables: {{name}}, {{firstname}}, {{queue}}. Customers select options by number.",
        filaDestino: "Destination queue",
        selecionarFila: "Select a queue",
        descricaoHumano:
          "Stops the chatbot and leaves the ticket available for the support team.",
        midia: "Attachment",
        anexar: "Select file",
        removerMidia: "Remove attachment",
        opcoes: "Next options",
        subir: "Move option up",
        descer: "Move option down",
        adicionarOpcao: "Add option",
        conectadoA: "Previous block",
        semConexao: "Disconnected",
        blocoAtivo: "Active block",
        desconectar: "Disconnect",
        excluir: "Delete",
        carregando: "Loading flow…",
        erroCarregar: "Could not load this flow.",
        tentarNovamente: "Try again",
        rascunhoAntigo:
          "An older draft exists in this browser. The current server version was loaded.",
        erroRascunho: "Could not store this draft. Publish before leaving.",
        publicado: "Flow published.",
        sairRascunho:
          "There are unpublished changes. Leave the editor? Pending attachments will need to be selected again.",
        rascunho: "Draft · unpublished",
        emUso: "Published",
        contagem: "{{count}} block",
        contagem_plural: "{{count}} blocks",
        testar: "Test path",
        publicar: "Publish",
        buscarBloco: "Search blocks",
        dicaPaleta:
          "Drag a block to the canvas or click to add it. Connect the handles to change the conversation path.",
        desfazer: "Undo",
        refazer: "Redo",
        minimapa: "Flow minimap",
        ajudaTeclado:
          "Select a block to edit it. Use Previous block to connect using the keyboard.",
        reduzirZoom: "Zoom out",
        aumentarZoom: "Zoom in",
        enquadrar: "Fit view",
        organizar: "Arrange blocks",
        pendencias:
          "{{count}} block needs a name, connection or destination queue.",
        pendencias_plural:
          "{{count}} blocks need a name, connection or destination queue.",
        pronto: "Connections are valid. Changes go live when you publish.",
        simulacaoDescricao:
          "Walk through the options as a customer. This preview does not send messages or change tickets.",
        simulacaoHumano: "The chatbot stops and the support team continues.",
        simulacaoTransferencia: "The conversation moves to {{fila}}.",
        simulacaoFim:
          "Alur selesai. Tiket tersedia untuk tim dukungan manusia.",
        reiniciar: "Restart test",
        excluirBloco: "Delete block?",
        excluirDescricao:
          "Following blocks will be kept and disconnected. Reconnect them before publishing.",
        selecionarFluxo: "Select flow",
        novoFluxo: "Create flow",
        secoes: "Automation sections",
        filasCanais: "Queues and channels",
        integracoes: "Integrations",
        primeiroFluxo: "Design your first conversation",
        descricaoInicio:
          "Create a queue, add blocks and connect your support steps.",
        descricaoEditor:
          "Create, connect and test blocks with a complete view of the conversation.",
        abrirEditor: "Open canvas",
        tipos: {
          inicio: "Conversation start",
          mensagem: "Send message",
          menu: "Options menu",
          midia: "Send media",
          transferir: "Transfer to queue",
          humano: "Human support"
        }
      },
      redesign: {
        importarCsv: "Import CSV file",
        exportarCsv: "Export contacts to CSV",
        descricaoContatos:
          "Contacts, groups and information for a personal service.",
        descricaoCampanhas:
          "Campaigns and schedules to keep track of every delivery.",
        descricaoConfiguracoes:
          "Service rules, team, channels and your organization’s identity.",

        operacao: "Operations",
        relacionamento: "Relationships",
        automacao: "Automation and AI",
        administracao: "Administration",
        envios: "Campaigns",
        listasContatos: "Contact lists",
        abrirAtendimento: "Open conversation",
        visaoGeral: "Operation overview",
        descricaoPainel: "Metrics, conversations and team in one place.",
        organizacao: "Organization"
      },
      voiceCalls: {
        settingsTab: "Panggilan eksperimental",
        companySwitch: "Panggilan eksperimental",
        enabled: "Diaktifkan",
        disabled: "Dinonaktifkan",
        experimentalTitle: "Integrasi panggilan eksperimental",
        warning:
          "Integrasi WhatsApp tidak resmi. Ada risiko terputus, ditangguhkan, atau diblokir. Gunakan hanya pada tenant pengujian.",
        serviceUnavailable: "Layanan panggilan sedang tidak tersedia.",
        riskConsent:
          "Saya memahami risikonya dan ingin menautkan perangkat kedua dengan kode QR.",
        status: "Status",
        disconnect: "Matikan dan putuskan",
        pair: "Tautkan dengan kode QR",
        noConnections:
          "Buat koneksi WhatsApp terlebih dahulu sebelum mengatur panggilan.",
        qrInstruction:
          "Di WhatsApp, buka Perangkat tertaut dan pindai kode QR kedua ini.",
        disconnectedSuccess: "Integrasi panggilan telah diputus.",
        incoming: "Panggilan masuk",
        incomingHint: "Agen pertama yang menerima akan menangani panggilan.",
        reject: "Tolak",
        accept: "Jawab",
        active: "Panggilan berlangsung",
        mute: "Bisukan mikrofon",
        transcribe: "Transkripsikan panggilan",
        record: "Rekam panggilan",
        end: "Akhiri",
        states: {
          disconnected: "Terputus",
          pairing: "Menunggu kode QR",
          connecting: "Menghubungkan",
          open: "Terhubung",
          logged_out: "Dilepas"
        },
        errors: {
          load: "Panggilan eksperimental tidak dapat dimuat.",
          pair: "Kode QR panggilan tidak dapat dibuat.",
          action: "Tindakan panggilan tidak dapat diselesaikan.",
          transcriptionConfig:
            "Atur GROQ_API_KEY di environment untuk mengaktifkan transkripsi.",
          microphone: "Izin mikrofon ditolak. Panggilan diakhiri."
        }
      },
      common: {
        search: "Cari",
        edit: "Edit",
        delete: "Hapus",
        cancel: "Batal",
        save: "Simpan",
        you: "Anda",
        confirm: "Konfirmasi",
        close: "Tutup",
        error: "Kesalahan",
        success: "Sukses",
        actions: "Aksi",
        add: "Tambah",
        name: "Nama",
        email: "Email",
        phone: "Telepon",
        company: "Perusahaan",
        connection: "Koneksi",
        queue: "Antrian",
        contact: "Kontak",
        serverTime: "Waktu server:",
        clientTime: "Waktu klien:",
        differenceMinutes: "Selisih: {{count}} menit"
      },
      signup: {
        title: "Daftar",
        toasts: {
          success: "Pengguna berhasil dibuat! Masuk sekarang!",
          fail: "Kesalahan saat membuat pengguna. Periksa data yang diberikan."
        },
        form: {
          name: "Nama",
          email: "Email",
          password: "Kata Sandi"
        },
        buttons: {
          submit: "Daftar",
          login: "Sudah punya akun? Masuk!"
        }
      },
      login: {
        title: "Masuk",
        form: {
          email: "Email",
          password: "Kata Sandi",
          newPassword: "Kata sandi baru",
          confirmPassword: "Konfirmasi kata sandi",
          passwordStrength:
            "Gunakan minimal 8 karakter dengan huruf besar, huruf kecil, dan angka."
        },
        buttons: {
          submit: "Masuk",
          continue: "Lanjutkan",
          createPassword: "Buat kata sandi dan masuk",
          changeEmail: "Ubah email",
          backToLogin: "Kembali ke login",
          register: "Belum punya akun? Daftar!"
        },
        errors: {
          emailNotFound: "Email ini tidak ditemukan.",
          passwordMismatch: "Kata sandi tidak cocok.",
          passwordStrength:
            "Kata sandi harus minimal 8 karakter dengan huruf besar, huruf kecil, dan angka.",
          activationInvalid:
            "Tautan aktivasi ini tidak valid atau sudah kedaluwarsa."
        },
        activation: {
          title: "Buat kata sandi Anda",
          account: "Mengaktifkan akun {{email}}"
        }
      },
      companies: {
        title: "Daftar Perusahaan",
        form: {
          name: "Nama Perusahaan",
          plan: "Paket",
          token: "Token",
          submit: "Daftar",
          success: "Perusahaan berhasil dibuat!"
        }
      },
      auth: {
        toasts: {
          success: "Login berhasil!"
        },
        token: "Token"
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Interaksi Hari Ini: "
          }
        },
        blog: {
          title: "Blog Espaço Whats",
          loading: "Memuat postingan...",
          error: "Postingan blog tidak dapat dimuat.",
          empty: "Tidak ada postingan blog.",
          showAll: "Tampilkan semua postingan",
          showLess: "Tampilkan lebih sedikit",
          openPost: "Baca postingan",
          previous: "Postingan sebelumnya",
          next: "Postingan berikutnya"
        }
      },
      connections: {
        title: "Koneksi",
        toasts: {
          deleted: "Koneksi WhatsApp berhasil dihapus!"
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage:
            "Apakah Anda yakin? Tindakan ini tidak bisa dibatalkan.",
          disconnectTitle: "Putuskan Koneksi",
          disconnectMessage:
            "Apakah Anda yakin? Anda perlu memindai Kode QR lagi."
        },
        buttons: {
          add: "Tambah WhatsApp",
          disconnect: "Putuskan",
          tryAgain: "Coba Lagi",
          qrcode: "KODE QR",
          newQr: "Kode QR Baru",
          connecting: "Menghubungkan"
        },
        toolTips: {
          disconnected: {
            title: "Gagal memulai sesi WhatsApp",
            content:
              "Pastikan ponsel Anda terhubung ke internet dan coba lagi, atau minta Kode QR baru."
          },
          qrcode: {
            title: "Menunggu pemindaian Kode QR",
            content:
              "Klik tombol 'KODE QR' dan pindai Kode QR dengan ponsel Anda untuk memulai sesi."
          },
          connected: {
            title: "Koneksi berhasil!"
          },
          timeout: {
            title: "Koneksi ke ponsel telah terputus",
            content:
              "Pastikan ponsel Anda terhubung ke internet dan WhatsApp terbuka, atau klik 'Putuskan' untuk mendapatkan Kode QR baru."
          },
          passkey: {
            title: "Passkey authentication required",
            content:
              "Click the passkey button and use the browser extension to capture the authenticated WhatsApp Web session."
          },
          refresh: "Muat ulang",
          disconnect: "Putuskan",
          scan: "Pindai",
          newQr: "Kode QR Baru",
          retry: "Coba Lagi"
        },
        table: {
          contact: "Kontak",
          name: "Nama",
          status: "Status",
          lastUpdate: "Pembaruan Terakhir",
          default: "Default",
          actions: "Aksi",
          session: "Sesi"
        }
      },
      internalChat: {
        title: "Obrolan Internal"
      },
      whatsappGroups: {
        configure: "Konfigurasi grup",
        mode: "Mode grup",
        conversation: "Percakapan",
        attendance: "Layanan",
        allowedQueues: "Antrean yang diizinkan",
        serviceQueue: "Antrean layanan",
        cancel: "Batal",
        save: "Simpan",
        confirmConversation:
          "Keluarkan grup ini dari alur layanan? Layanan aktif akan berakhir tanpa penilaian."
      },
      whatsappModal: {
        title: {
          add: "Tambah WhatsApp",
          edit: "Edit WhatsApp"
        },
        form: {
          name: "Nama",
          default: "Default"
        },
        buttons: {
          okAdd: "Tambah",
          okEdit: "Simpan",
          cancel: "Batal"
        },
        success: "WhatsApp berhasil disimpan."
      },
      qrCode: {
        message: "Pindai Kode QR untuk memulai sesi",
        extensionHint: "Autentikasi melalui WhatsApp Web",
        startCapture: "Tangkap sesi WhatsApp Web",
        installExtension: "Pasang Ekstensi Tangkap"
      },
      passkeyModal: {
        title: "Ekstensi Tangkap WhatsApp Web",
        instructions:
          "Use the browser extension to capture the authenticated WhatsApp Web session and send it to the server.",
        connectorNotFound:
          "Extension not detected. Install the passkey capture extension and reload the page.",
        connectorReady:
          "Ekstensi terdeteksi. Klik di bawah untuk mengautentikasi melalui WhatsApp Web.",
        startCapture: "Start Capture",
        waitingForCapture: "Waiting for WhatsApp Web session capture…",
        existingSession: "WhatsApp Web already has a session for {{number}}.",
        captureExisting: "Capture this session",
        clearAndContinue: "Clear local session and continue",
        importSent: "Session captured and sent successfully.",
        importError: "Capture failed: {{reason}}.",
        missingToken: "Capture token is missing. Please reload the page.",
        downloadExtension: "Unduh ekstensi penangkapan",
        installInstructions: "Cara memasang",
        hideInstructions: "Sembunyikan instruksi",
        instructionsIntro:
          "Ikuti langkah-langkah di bawah ini untuk memasang ekstensi:",
        installStep1: "Unduh file ZIP ekstensi.",
        installStep2: "Ekstrak file ZIP ke folder di komputer Anda.",
        installStep3: "Buka Google Chrome dan akses chrome://extensions/.",
        installStep4:
          "Aktifkan Mode pengembang dengan tombol di sudut kanan atas.",
        installStep5: 'Klik "Muat yang tidak dipaketkan".',
        installStep6: "Pilih folder hasil ekstraksi yang berisi file ekstensi.",
        installStep7: "Ekstensi telah terpasang dan siap digunakan.",
        installStep8:
          "Segarkan halaman ini dengan F5 dan coba hubungkan kembali."
      },
      contacts: {
        title: "Kontak",
        toasts: {
          deleted: "Kontak berhasil dihapus!"
        },
        searchPlaceholder: "Cari...",
        confirmationModal: {
          deleteTitle: "Hapus",
          importTitlte: "Impor Kontak",
          deleteMessage:
            "Apakah Anda yakin ingin menghapus kontak ini? Semua interaksi terkait akan hilang.",
          importMessage: "Apakah Anda ingin mengimpor semua kontak dari ponsel?"
        },
        buttons: {
          import: "Impor Kontak",
          add: "Tambah Kontak"
        },
        table: {
          name: "Nama",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Aksi"
        }
      },
      contactModal: {
        title: {
          add: "Tambah Kontak",
          edit: "Edit Kontak"
        },
        form: {
          mainInfo: "Informasi Kontak",
          extraInfo: "Informasi Tambahan",
          name: "Nama",
          number: "Nomor WhatsApp",
          email: "Email",
          extraName: "Nama Bidang",
          extraValue: "Nilai",
          disableBot: "Nonaktifkan chatbot"
        },
        buttons: {
          addExtraInfo: "Tambah Informasi",
          okAdd: "Tambah",
          okEdit: "Simpan",
          cancel: "Batal"
        },
        success: "Kontak berhasil disimpan."
      },
      queueModal: {
        title: {
          add: "Tambah Antrian",
          edit: "Edit Antrian"
        },
        form: {
          name: "Nama",
          color: "Warna",
          greetingMessage: "Pesan Sambutan",
          complationMessage: "Pesan Penyelesaian",
          outOfHoursMessage: "Pesan Di Luar Jam Kerja",
          ratingMessage: "Pesan Penilaian",
          transferMessage: "Pesan Transfer",
          connections: "Koneksi WhatsApp",
          connectionsHelp:
            "Antrean dan chatbot hanya tersedia pada koneksi ini.",
          token: "Token"
        },
        validation: {
          connectionRequired: "Pilih setidaknya satu koneksi untuk antrean."
        },
        outOfHoursAction: {
          title: "Tindakan Di Luar Jam Kerja",
          options: {
            pending: "Biarkan tertunda",
            closed: "Tutup tiket"
          }
        },
        toasts: {
          deleted: "Antrean berhasil disimpan"
        },
        buttons: {
          okAdd: "Tambah",
          okEdit: "Simpan",
          cancel: "Batal",
          attach: "Lampirkan File"
        },
        serviceHours: {
          dayWeek: "Hari dalam Minggu",
          startTimeA: "Waktu Mulai - Shift A",
          endTimeA: "Waktu Berakhir - Shift A",
          startTimeB: "Waktu Mulai - Shift B",
          endTimeB: "Waktu Berakhir - Shift B",
          monday: "Senin",
          tuesday: "Selasa",
          wednesday: "Rabu",
          thursday: "Kamis",
          friday: "Jumat",
          saturday: "Sabtu",
          sunday: "Minggu"
        }
      },
      userModal: {
        title: {
          add: "Tambah Pengguna",
          edit: "Edit Pengguna"
        },
        form: {
          name: "Nama",
          email: "Email",
          password: "Kata Sandi",
          profile: "Profil"
        },
        buttons: {
          okAdd: "Tambah",
          okEdit: "Simpan",
          cancel: "Batal"
        },
        success: "Pengguna berhasil disimpan."
      },
      scheduleModal: {
        title: {
          add: "Jadwal Baru",
          edit: "Edit Jadwal"
        },
        form: {
          body: "Pesan",
          contact: "Kontak",
          sendAt: "Tanggal Dijadwalkan",
          sentAt: "Tanggal Terkirim",
          saveMessage: "Simpan Pesan di Tiket"
        },
        buttons: {
          okAdd: "Tambah",
          okEdit: "Simpan",
          cancel: "Batal"
        },
        success: "Jadwal berhasil disimpan."
      },
      tagModal: {
        title: {
          add: "Tag Baru",
          edit: "Edit Tag",
          addKanban: "Lorong Baru",
          editKanban: "Edit Lorong"
        },
        form: {
          name: "Nama",
          color: "Warna",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Tambah",
          okEdit: "Simpan",
          cancel: "Batal"
        },
        success: "Tag berhasil disimpan.",
        successKanban: "Lorong berhasil disimpan."
      },
      chat: {
        noTicketMessage: "Pilih tiket untuk memulai percakapan."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "SERET DAN LETAKKAN FILE DI KOLOM DI BAWAH",
          titleFileList: "Daftar file(s)"
        }
      },
      billing: {
        trialDays: "Hari uji coba gratis",
        trialDaysHelp: "0 berarti tanpa uji coba gratis",
        dueDay: "Hari jatuh tempo",
        dueDayHelp: "Bulanan; bulan pendek memakai hari terakhir",
        prorata: "Prorata",
        trialEndsIn: "Uji coba berakhir dalam {{days}} hari.",
        noActiveTrial: "Tidak ada uji coba aktif",
        period: "Periode: {{start}} hingga {{end}}"
      },
      todolist: {
        title: "Papan tugas",
        loading: "Memuat papan...",
        loadError: "Papan tidak dapat dimuat.",
        emptyColumn: "Seret tugas ke kolom ini",
        dragTask: "Pindahkan tugas",
        dragTaskLabel: "Pindahkan tugas {{title}}",
        completedAt: "Selesai pada {{date}}",
        editTaskTitle: "Edit tugas",
        newTaskTitle: "Tugas baru",
        targets: { global: "Global", user: "Pengguna", queue: "Antrean" },
        deadline: {
          ok: "Tepat waktu",
          warning: "Segera jatuh tempo",
          overdue: "Terlambat"
        },
        details: {
          noDescription: "Tanpa deskripsi",
          state: "Status",
          createdBy: "Dibuat oleh",
          target: "Tujuan",
          createdAt: "Dibuat",
          dueAt: "Tenggat",
          completedAt: "Selesai",
          history: "Riwayat"
        },
        events: {
          CREATED: "Dibuat",
          EDITED: "Diedit",
          MOVED: "Dipindah",
          COMPLETED: "Selesai",
          REOPENED: "Dibuka kembali"
        },
        form: {
          name: "Nama tugas",
          columnName: "Nama kolom",
          description: "Deskripsi",
          targetType: "Tujuan",
          assignee: "Pengguna yang ditugaskan",
          queue: "Antrean yang ditugaskan",
          dueAt: "Tenggat"
        },
        buttons: {
          add: "Tambah",
          newTask: "Tugas baru",
          save: "Simpan",
          configure: "Atur kolom",
          clearFilter: "Hapus filter",
          tryAgain: "Coba lagi",
          editTask: "Edit tugas",
          deleteTask: "Hapus tugas",
          addColumn: "Tambah kolom"
        },
        filters: {
          from: "Selesai dari",
          to: "Selesai sampai",
          invalidDate: "Tanggal tidak valid"
        },
        settings: {
          title: "Atur kolom",
          description:
            "Sesuaikan urutan, nama, dan warna. Hanya satu kolom yang mewakili tugas selesai.",
          markDone: "Tandai {{title}} sebagai kolom selesai",
          doneColumn: "Kolom tugas selesai",
          regularColumn: "Kolom tugas berjalan",
          moveLeft: "Pindah ke kiri",
          moveRight: "Pindah ke kanan",
          editColumn: "Edit kolom",
          newColumn: "Kolom baru",
          chooseColor: "Pilih warna",
          useBrandColor: "Gunakan warna perusahaan"
        },
        confirm: {
          deleteTaskTitle: "Hapus tugas",
          deleteTask: "Hapus tugas “{{title}}”?",
          deleteColumnTitle: "Hapus kolom",
          deleteColumn: "Hapus kolom “{{title}}”?"
        },
        toasts: {
          taskCreated: "Tugas dibuat.",
          taskSaved: "Tugas diperbarui.",
          taskDeleted: "Tugas dihapus.",
          columnSaved: "Kolom disimpan.",
          columnDeleted: "Kolom dihapus.",
          doneColumnChanged: "Kolom selesai diperbarui."
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Baru"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Antrian"
      },
      tickets: {
        toasts: {
          deleted: "Tiket yang Anda kerjakan telah dihapus."
        },
        notification: {
          message: "Pesan dari",
          nomessages: "Tidak ada pesan"
        },
        tabs: {
          open: {
            title: "Buka"
          },
          closed: {
            title: "Tutup"
          },
          groups: {
            title: "Grup",
            conversations: "Percakapan",
            attendances: "Layanan",
            pending: "Menunggu",
            open: "Sedang dilayani",
            closed: "Selesai"
          },
          search: {
            title: "Cari"
          }
        },
        search: {
          placeholder: "Cari tiket dan pesan"
        },
        buttons: {
          showAll: "Semua"
        }
      },
      transferTicketModal: {
        title: "Transfer Tiket",
        fieldLabel: "Ketik untuk mencari pengguna",
        fieldConnectionLabel: "Transfer melalui koneksi",
        fieldConnectionPlaceholder: "Pilih koneksi",
        connectionHelp: "Setelah memilih koneksi, pilih antrean yang tersedia.",
        connectionUnavailable: "terputus",
        fieldQueueLabel: "Transfer ke antrian",
        fieldQueuePlaceholder: "Pilih antrian",
        noOptions: "Tidak ada pengguna yang ditemukan dengan nama itu",
        buttons: {
          ok: "Transfer",
          cancel: "Batal"
        }
      },
      ticketsList: {
        pendingHeader: "Tertunda",
        assignedHeader: "Ditugaskan",
        noTicketsTitle: "Tidak ada apa-apa di sini!",
        noTicketsMessage:
          "Tidak ada tiket yang ditemukan dengan status ini atau istilah pencarian",
        buttons: {
          accept: "Terima"
        }
      },
      newTicketModal: {
        title: "Buat Tiket",
        fieldLabel: "Cari kontak",
        add: "Tambah",
        buttons: {
          ok: "Simpan",
          cancel: "Batal"
        }
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dasbor",
          connections: "Koneksi",
          tickets: "Tiket",
          quickMessages: "Respon Cepat",
          contacts: "Kontak",
          queues: "Antrian",
          tags: "Tags",
          administration: "Administrasi",
          service: "Service",
          users: "Pengguna",
          settings: "Pengaturan",
          helps: "Bantuan",
          chatgpt: "ChatGPT",
          schedules: "Penjadwalan",
          campaigns: "Kampanye",
          annoucements: "Pengumuman",
          chats: "Chat Internal",
          financeiro: "Finansial",
          cobranca: "Billing",
          prospeccao: "Prospek",
          logout: "Logout",
          management: "Management",
          kanban: "Kanban",
          tasks: "Tugas"
        },
        appBar: {
          i18n: {
            language: "Indonesian",
            language_short: "ID"
          },
          user: {
            profile: "Profile",
            subscriptionValidUntilLabel: "Langganan aktif sampai",
            darkmode: "Dark mode",
            lightmode: "Light mode",
            language: "Select language",
            about: "About",
            logout: "Keluar"
          }
        }
      },
      chatgpt: {
        title: "ChatGPT",
        enabled: "Pilot aktif",
        disabled: "Pilot nonaktif",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Direkomendasikan",
          description:
            "Cara termudah menggunakan data layanan pelanggan Anda di ChatGPT.",
          details:
            "Instal plugin, hubungkan akun Espaço Whats dengan OAuth, lalu gunakan dari menu plugin atau dengan menyebut @EspaçoWhats.",
          open: "Buka plugin di ChatGPT",
          steps: {
            title: "Cara menginstal dan menghubungkan",
            open: "Buka plugin Espaço Whats di ChatGPT",
            install: "Klik Instal plugin",
            connect: "Pilih Hubungkan",
            login: "Masuk dengan tenant, email, dan kata sandi administrator",
            use: "Gunakan menu plugin atau sebut @EspaçoWhats"
          },
          marketplace: {
            title: "Instalasi GitHub untuk workspace",
            description:
              "Administrator juga dapat mengimpor marketplace resmi melalui Pengaturan workspace → Plugin → Tambah → Impor marketplace.",
            repository: "Repositori",
            path: "Path",
            pathValue: "Biarkan kosong",
            branch: "Branch",
            copy: "Salin repositori"
          }
        },
        warningTitle: "Data pribadi dan klinis",
        warning:
          "Setelah terhubung, percakapan yang dapat diidentifikasi dan kemungkinan data klinis dapat dikirim ke ChatGPT sesuai pertanyaan Anda. Gunakan hanya setelah persetujuan hukum dan administratif.",
        copy: "Salin URL",
        connection: {
          title: "URL server MCP",
          description:
            "Espaço Whats tidak menggunakan kunci OpenAI. Kecerdasan dan batas penggunaan mengikuti paket ChatGPT pengguna."
        },
        steps: {
          title: "Cara menghubungkan",
          open: "Buka Developer Mode ChatGPT",
          create: "Buat integrasi MCP Draft",
          url: "Tempel URL MCP",
          oauth: "Pilih OAuth",
          login: "Masuk dengan tenant, email admin, dan kata sandi"
        },
        connections: {
          title: "Koneksi aktif",
          empty: "Belum ada koneksi ChatGPT.",
          client: "Klien",
          admin: "Administrator",
          created: "Dibuat",
          lastUse: "Terakhir digunakan",
          revoke: "Cabut",
          revokeAll: "Cabut semua"
        },
        revoke: {
          title: "Cabut koneksi",
          one: "Koneksi ini akan segera kehilangan akses.",
          all: "Semua koneksi tenant ini akan segera kehilangan akses."
        },
        toasts: {
          copied: "URL MCP disalin.",
          repositoryCopied: "Repositori plugin disalin.",
          revoked: "Koneksi dicabut."
        }
      },
      notifications: {
        noTickets: "Tidak ada notifikasi."
      },
      quickMessages: {
        title: "Respon Cepat",
        buttons: {
          add: "Respon Baru"
        },
        dialog: {
          shortcode: "Pintasan",
          message: "Respon"
        }
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Cari",
        subMenus: {
          list: "Panel",
          tags: "Jalur"
        }
      },
      tagsKanban: {
        title: "Jalur",
        laneDefault: "Buka",
        confirmationModal: {
          deleteTitle: "Apakah Anda yakin ingin menghapus Jalur ini?",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan."
        },
        table: {
          name: "Nama",
          color: "Warna",
          tickets: "Tiket",
          actions: "Aksi"
        },
        buttons: {
          add: "Jalur Baru"
        },
        toasts: {
          deleted: "Jalur berhasil dihapus."
        }
      },
      contactLists: {
        title: "Daftar Kontak",
        table: {
          name: "Nama",
          contacts: "Kontak",
          actions: "Tindakan"
        },
        buttons: {
          add: "Daftar Baru"
        },
        dialog: {
          name: "Nama",
          company: "Perusahaan",
          okEdit: "Edit",
          okAdd: "Tambah",
          add: "Tambah",
          edit: "Edit",
          cancel: "Batal"
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan."
        },
        toasts: {
          deleted: "Rekam dihapus",
          created: "Rekam dibuat"
        }
      },
      contactListItems: {
        title: "Kontak",
        searchPlaceholder: "Cari",
        buttons: {
          add: "Baru",
          lists: "Daftar",
          import: "Impor"
        },
        dialog: {
          name: "Nama",
          number: "Nomor",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Edit",
          okAdd: "Tambah",
          add: "Tambah",
          edit: "Edit",
          cancel: "Batal"
        },
        table: {
          name: "Nama",
          number: "Nomor",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Aksi"
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
          importMessage:
            "Apakah Anda ingin mengimpor kontak dari spreadsheet ini?",
          importTitlte: "Impor"
        },
        toasts: {
          deleted: "Data berhasil dihapus"
        }
      },
      campaigns: {
        title: "Kampanye",
        searchPlaceholder: "Cari",
        buttons: {
          add: "Kampanye Baru",
          contactLists: "Daftar Kontak"
        },
        table: {
          name: "Nama",
          whatsapp: "Koneksi",
          contactList: "Daftar Kontak",
          status: "Status",
          scheduledAt: "Dijadwalkan",
          completedAt: "Selesai",
          confirmation: "Konfirmasi",
          actions: "Aksi"
        },
        dialog: {
          new: "Kampanye Baru",
          update: "Edit Kampanye",
          readonly: "Hanya-baca",
          form: {
            name: "Nama",
            message1: "Pesan 1",
            message2: "Pesan 2",
            message3: "Pesan 3",
            message4: "Pesan 4",
            message5: "Pesan 5",
            confirmationMessage1: "Pesan Konfirmasi 1",
            confirmationMessage2: "Pesan Konfirmasi 2",
            confirmationMessage3: "Pesan Konfirmasi 3",
            confirmationMessage4: "Pesan Konfirmasi 4",
            confirmationMessage5: "Pesan Konfirmasi 5",
            messagePlaceholder: "Isi Pesan",
            whatsapp: "Koneksi",
            status: "Status",
            scheduledAt: "Dijadwalkan",
            confirmation: "Konfirmasi",
            contactList: "Daftar Kontak"
          },
          buttons: {
            add: "Tambah",
            edit: "Perbarui",
            okadd: "Oke",
            cancel: "Batalkan Pengiriman",
            restart: "Mulai Ulang Pengiriman",
            close: "Tutup",
            attach: "Lampirkan File"
          }
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan."
        },
        toasts: {
          success: "Operasi berhasil diselesaikan",
          cancel: "Kampanye dibatalkan",
          restart: "Kampanye dimulai ulang",
          deleted: "Data berhasil dihapus"
        }
      },
      announcements: {
        title: "Pengumuman",
        searchPlaceholder: "Cari",
        buttons: {
          add: "Pengumuman Baru",
          contactLists: "Daftar Pengumuman"
        },
        table: {
          priority: "Prioritas",
          title: "Judul",
          text: "Teks",
          mediaName: "File",
          status: "Status",
          actions: "Aksi"
        },
        dialog: {
          edit: "Edit Pengumuman",
          add: "Pengumuman Baru",
          update: "Edit Pengumuman",
          readonly: "Hanya-baca",
          form: {
            priority: "Prioritas",
            title: "Judul",
            text: "Teks",
            mediaPath: "File",
            status: "Status"
          },
          buttons: {
            add: "Tambah",
            edit: "Perbarui",
            okadd: "Oke",
            cancel: "Batal",
            close: "Tutup",
            attach: "Lampirkan File"
          }
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan."
        },
        toasts: {
          success: "Operasi berhasil diselesaikan",
          deleted: "Data berhasil dihapus"
        }
      },
      campaignsConfig: {
        title: "Konfigurasi Kampanye"
      },
      queues: {
        title: "Antrian & Chatbot",
        table: {
          name: "Nama",
          color: "Warna",
          greeting: "Pesan Sambutan",
          actions: "Aksi"
        },
        buttons: {
          add: "Tambah Antrian"
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage:
            "Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan! Tiket dari antrian ini akan tetap ada tetapi tidak akan lagi ditugaskan ke antrian mana pun."
        }
      },
      queueSelect: {
        inputLabel: "Antrian"
      },
      users: {
        title: "Pengguna",
        empty: "Tidak ada pengguna yang ditemukan.",
        filters: {
          queue: "Antrian",
          allQueues: "Semua antrian"
        },
        profiles: {
          admin: "Administrator",
          user: "Pengguna"
        },
        groups: {
          admin: "Administrator",
          user: "Pengguna"
        },
        table: {
          name: "Nama",
          email: "Email",
          profile: "Profil",
          queues: "Antrian",
          noQueues: "Tanpa antrian",
          actions: "Aksi"
        },
        buttons: {
          add: "Tambah Pengguna"
        },
        toasts: {
          deleted: "Pengguna berhasil dihapus."
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage:
            "Semua data pengguna akan hilang. Tiket terbuka dari pengguna ini akan dipindahkan ke antrian."
        }
      },
      helps: {
        title: "Pusat Bantuan",
        adminOnly: "Hanya administrator",
        groupModal: {
          adminOnlyHelper:
            "Kartu ini dan seluruh isinya disembunyikan dari pengguna biasa."
        },
        contentModal: {
          adminOnly: "Hanya terlihat oleh administrator"
        }
      },
      about: {
        aboutthe: "Tentang",
        copyright: "� 2024 - Didukung oleh Espaço Whats",
        buttonclose: "Tutup",
        title: "Tentang Espaço Whats",
        abouttitle: "Asal dan peningkatan",
        aboutdetail:
          "Espaço Whats berasal secara tidak langsung dari proyek Whaticket dengan peningkatan yang dibagikan oleh para pengembang sistem EquipeChat melalui saluran VemFazer di YouTube, kemudian ditingkatkan oleh Claudemir Todo Bom",
        aboutauthorsite: "Situs penulis",
        aboutwhaticketsite: "Situs Komunitas Whaticket di Github",
        aboutvemfazersite: "Situs saluran Vem Fazer di Github",
        licenseheading: "Lisensi Sumber Terbuka",
        licensedetail:
          "Espaço Whats dilisensikan di bawah GNU Affero General Public License versi 3, yang berarti bahwa setiap pengguna yang memiliki akses ke aplikasi ini berhak untuk mendapatkan akses ke kode sumbernya. Informasi lebih lanjut di tautan berikut:",
        licensefulltext: "Teks lengkap lisensi",
        licensesourcecode: "Kode sumber Espaço Whats"
      },
      schedules: {
        title: "Jadwal",
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage:
            "Apakah Anda yakin ingin menghapus kampanye ini? Tindakan ini tidak dapat dibatalkan."
        },
        table: {
          contact: "Kontak",
          body: "Pesan",
          sendAt: "Tanggal Penjadwalan",
          sentAt: "Tanggal Pengiriman",
          status: "Status",
          actions: "Aksi"
        },
        buttons: {
          add: "Jadwal Baru"
        },
        toasts: {
          deleted: "Jadwal berhasil dihapus."
        }
      },
      tags: {
        title: "Tag",
        confirmationModal: {
          deleteTitle: "Apakah Anda yakin ingin menghapus Tag ini?",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan."
        },
        table: {
          name: "Nama",
          color: "Warna",
          tickets: "Catatan",
          actions: "Aksi",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Tag Baru"
        },
        toasts: {
          deleted: "Tag berhasil dihapus."
        }
      },
      whitelabel: {
        primaryColorLight: "Warna Utama Terang",
        primaryColorDark: "Warna Utama Gelap",
        lightLogo: "Logo aplikasi terang",
        darkLogo: "Logo aplikasi gelap",
        favicon: "Favicon logo aplikasi",
        appname: "Nama aplikasi",
        logoHint: "Prefer SVG dan aspek 28:10",
        faviconHint: "Prefer gambar SVG persegi atau PNG 512x512",
        loginLinks: "Tautan login",
        loginLinksHint:
          "Tambahkan pasangan judul dan URL untuk ditampilkan di bawah kotak login pada desktop dan mobile.",
        linkTitle: "Judul tautan",
        linkUrl: "URL tautan",
        removeLink: "Hapus tautan",
        sidePanelImage: "Gambar panel samping login",
        sidePanelImageHint:
          "Ditampilkan pada panel samping login di layar desktop.",
        backgroundContent: "Konten latar login",
        backgroundContentHint:
          "Mendukung gambar, file SVG, dan video MP4 untuk latar layar login.",
        noFileSelected: "Belum ada file yang dipilih.",
        buildExtension: "Bangun ekstensi WA Session Capture",
        buildingExtension: "Membangun ekstensi…",
        downloadExtension: "Unduh ekstensi",
        extensionHint:
          "Membangun ekstensi Chrome whitelabel. File ZIP yang diunduh sudah berisi file ekstensi: ekstrak dan muat folder hasil ekstraksi sebagai ekstensi yang tidak dipaketkan.",
        extensionBuildStarted:
          "Pembangunan ekstensi dimulai. Anda akan diberitahu saat sudah siap.",
        extensionBuildFailed: "Tidak dapat memulai pembangunan ekstensi.",
        extensionBuilt: "Ekstensi berhasil dibangun.",
        extensionBuildUnknownError: "Kesalahan build tidak diketahui."
      },
      settings: {
        group: {
          general: "Umum",
          timeouts: "Waktu habis",
          officeHours: "Jam kantor",
          groups: "Grup",
          confidenciality: "Kerahasiaan",
          api: "API",
          serveradmin: "Administrasi Server"
        },
        success: "Pengaturan berhasil disimpan.",
        copiedToClipboard: "Disalin ke clipboard",
        title: "Pengaturan",
        settings: {
          userCreation: {
            name: "Pembuatan pengguna",
            options: {
              enabled: "Diaktifkan",
              disabled: "Dinonaktifkan"
            }
          }
        },
        validations: {
          title: "validasi",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        OfficeManagement: {
          title: "Manajemen kantor",
          options: {
            disabled: "Dinonaktifkan",
            ManagementByDepartment: "Manajemen berdasarkan departemen",
            ManagementByCompany: "Manajemen oleh perusahaan"
          }
        },
        IgnoreGroupMessages: {
          title: "Abaikan pesan grup",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        soundGroupNotifications: {
          title: "Notifikasi grup suara",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        groupsTab: {
          title: "Tab grup",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        VoiceAndVideoCalls: {
          title: "Panggilan suara dan video",
          options: {
            enabled: "Abaikan.",
            disabled: "laporan ketidaktersediaan"
          }
        },
        AutomaticChatbotOutput: {
          title: "Output chatbot otomatis",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        ShowNumericEmoticons: {
          title: "Menampilkan emoji numerik dalam antrean",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        QuickMessages: {
          title: "Pesan cepat",
          options: {
            enabled: "Berdasarkan perusahaan",
            disabled: "Oleh Pengguna"
          }
        },
        AllowRegistration: {
          title: "Izinkan pendaftaran",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        FileDownloadLimit: {
          title: "Batas unduhan file (MB)"
        },
        messageVisibility: {
          title: "Visibilitas Pesan",
          options: {
            respectMessageQueue: "Hormati Antrian Pesan",
            respectTicketQueue: "Hormati Antrian Tiket"
          }
        },
        keepQueueAndUser: {
          title_id: "Simpan antrian dan pengguna pada tiket tertutup",
          options: {
            enabled: "Diaktifkan",
            disabled: "Dinonaktifkan"
          }
        },
        GracePeriod: {
          title: "Periode penundaan langganan berakhir (hari)"
        },
        ticketAcceptedMessage: {
          title: "Pesan Tiket Diterima",
          placeholder: "Masukkan pesan tiket diterima di sini"
        },
        transferMessage: {
          title: "Pesan Transfer",
          placeholder: "Masukkan pesan transfer di sini"
        },
        mustacheVariables: {
          title: "Variabel yang tersedia:"
        },
        WelcomeGreeting: {
          greetings: "halo",
          welcome: "selamat datang di",
          expirationTime: "Aktif sampai"
        },
        Options: {
          title: "Pilihan"
        },
        Companies: {
          title: "Perusahaan"
        },
        schedules: {
          title: "Jadwal"
        },
        Plans: {
          title: "Rencana"
        },
        Help: {
          title: "Bantuan"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Payment Gateways"
        },
        i18nSettings: {
          title: "Terjemahan"
        }
      },
      messagesList: {
        header: {
          assignedTo: "Ditugaskan kepada:",
          buttons: {
            return: "Kembali",
            resolve: "Selesaikan",
            reopen: "Buka Kembali",
            accept: "Terima"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Ketik pesan",
        placeholderClosed:
          "Buka kembali atau terima tiket ini untuk mengirim pesan.",
        signMessage: "Tandatangani",
        replying: "Membalas",
        editing: "Mengedit"
      },
      message: {
        edited: "Diedit",
        forwarded: "Diteruskan"
      },

      contactDrawer: {
        header: "Informasi Kontak",
        groupHeader: "Informasi grup",
        buttons: {
          edit: "Edit Kontak"
        },
        extraInfo: "Informasi lainnya",
        participants: "Peserta",
        participantsUnavailable: "Tidak dapat memuat peserta",
        you: "Anda",
        admin: "Admin",
        owner: "Pembuat"
      },
      ticketOptionsMenu: {
        schedule: "Jadwal",
        delete: "Hapus",
        transfer: "Transfer",
        appointmentsModal: {
          title_id: "Catatan Tiket",
          textarea: "Catatan",
          placeholder: "Masukkan informasi yang ingin Anda catat di sini"
        },
        confirmationModal: {
          title: "Hapus tiket kontak",
          message:
            "Perhatian! Semua pesan yang terkait dengan tiket akan hilang."
        },
        buttons: {
          delete: "Hapus",
          cancel: "Batal"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Oke",
          cancel: "Batal"
        }
      },
      messageOptionsMenu: {
        delete: "Hapus",
        edit: "Edit",
        forward: "Teruskan",
        history: "Riwayat",
        reply: "Balas",
        confirmationModal: {
          title: "Hapus pesan?",
          message: "Tindakan ini tidak dapat dibatalkan."
        }
      },
      messageHistoryModal: {
        close: "Tutup",
        title: "Riwayat edit pesan"
      },
      presence: {
        unavailable: "Tidak tersedia",
        available: "Tersedia",
        composing: "Menulis...",
        recording: "Merekam...",
        paused: "Jeda"
      },
      privacyModal: {
        title: "Edit Privasi Whatsapp",
        buttons: {
          cancel: "Membatalkan",
          okEdit: "Menyimpan"
        },
        form: {
          menu: {
            all: "Semua",
            none: "Bukan siapa-siapa",
            contacts: "Kontak saya",
            contact_blacklist: "Kontak yang dipilih",
            match_last_seen: "Pertandingan Terakhir Dilihat",
            known: "Diketahui",
            disable: "Dengan disabilitas",
            hrs24: "24 Jam",
            dias7: "7 Hari",
            dias90: "90 Hari"
          },
          readreceipts: "Untuk memperbarui privasi Tanda Terima Baca",
          profile: "Untuk memperbarui privasi Gambar Profil",
          status: "Untuk memperbarui privasi Pesan",
          online: "Untuk memperbarui Privasi Online",
          last: "Untuk memperbarui privasi Terakhir terlihat",
          groupadd: "Untuk memperbarui Grup Tambahkan privasi",
          calladd: "Untuk memperbarui Panggilan Tambahkan privasi",
          disappearing: "Untuk memperbarui Mode Hilang Default"
        }
      },
      frontendErrors: {
        ERR_CONFIG_ERROR: "Kesalahan konfigurasi. Silakan hubungi dukungan.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Jam tidak sinkron. Silakan periksa pengaturan tanggal dan waktu perangkat Anda.",
        ERR_BACKEND_UNREACHABLE:
          "Backend tidak dapat dijangkau. Silakan coba lagi nanti.",
        ERR_BACKEND_NOT_READY:
          "Backend sedang memulai dan belum siap. Mencoba lagi secara otomatis."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "Tidak ada koneksi WhatsApp untuk membuka percakapan.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO:
          "Lead ini sudah tidak ada di basis Anda.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "Lead ini tidak punya nomor telepon untuk membuka percakapan.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "Prospek belum dikonfigurasi di server ini.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "Kunci akses prospek ditolak. Hubungi dukungan.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "Layanan prospek tidak merespons. Coba lagi beberapa menit.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "Layanan prospek menolak pencarian ini. Periksa niche dan kota.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "Pencarian ini sudah tidak ada di layanan prospek.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Isi niche dan kota untuk mencari lead.",
        ERR_FLOW_INVALID: "Invalid flow data. Review the blocks.",
        ERR_FLOW_CONNECTION:
          "This connection is not allowed. Transfer and human support blocks end the flow.",
        ERR_FLOW_QUEUE_REQUIRED:
          "Select a valid destination queue different from this one.",
        ERR_FLOW_DISCONNECTED:
          "Connect every block to the start without creating cycles.",
        ERR_FLOW_CONFLICT:
          "This flow changed in another session. Reload before publishing.",
        ERR_FLOW_IN_USE:
          "A removed block is used by an active ticket. Disable it or wait for completion before deleting.",
        ERR_INVALID_TRIAL_DAYS:
          "Hari uji coba harus berupa bilangan bulat antara 0 dan 3650.",
        ERR_INVALID_DUE_DAY:
          "Hari jatuh tempo harus berupa bilangan bulat antara 1 dan 31.",
        ERR_TRIAL_ALREADY_STARTED:
          "Uji coba gratis tidak dapat diubah setelah penagihan dimulai.",
        ERR_TASK_BOARD_INVALID_TITLE: "Masukkan judul yang valid.",
        ERR_TASK_BOARD_INVALID_COLOR: "Masukkan warna heksadesimal yang valid.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Kolom tidak ditemukan.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Tugas tidak ditemukan.",
        ERR_TASK_BOARD_INVALID_DATE: "Masukkan tanggal yang valid.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE: "Rentang tanggal tidak valid.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "Papan harus memiliki kolom tugas selesai.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER: "Urutan kolom tidak valid.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Pilih kolom selesai lain sebelum menghapus kolom ini.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Pindahkan tugas sebelum menghapus kolom ini.",
        ERR_EMAIL_NOT_FOUND: "Email ini tidak ditemukan.",
        ERR_COMPANY_SUSPENDED:
          "Akun ini ditangguhkan. Hubungi penanggung jawab langganan Anda.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "Akun ini sudah memiliki kata sandi. Kembali ke halaman login.",
        ERR_ACTIVATION_INVALID:
          "Tautan aktivasi ini tidak valid atau sudah kedaluwarsa.",
        ERR_PASSWORD_CONFIRMATION: "Kata sandi tidak cocok.",
        ERR_PASSWORD_TOO_WEAK:
          "Kata sandi harus minimal 8 karakter dengan huruf besar, huruf kecil, dan angka.",
        ERR_FORBIDDEN: "Akses ditolak. Periksa izin Anda.",
        ERR_CHECK_NUMBER: "Nomor ini tidak terdaftar di WhatsApp.",
        ERR_NO_OTHER_WHATSAPP: "Harus ada setidaknya satu WhatsApp default.",
        ERR_NO_DEF_WAPP_FOUND:
          "Tidak ada WhatsApp default yang ditemukan. Periksa halaman koneksi.",
        ERR_WAPP_NOT_INITIALIZED:
          "Sesi WhatsApp ini belum diinisialisasi. Periksa halaman koneksi.",
        ERR_WAPP_CHECK_CONTACT:
          "Tidak dapat memeriksa kontak WhatsApp. Periksa halaman koneksi.",
        ERR_WAPP_INVALID_CONTACT: "Ini bukan nomor WhatsApp yang valid.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Tidak dapat mengunduh media dari WhatsApp. Periksa halaman koneksi.",
        ERR_INVALID_CREDENTIALS: "Kesalahan autentikasi. Silakan coba lagi.",
        ERR_SENDING_WAPP_MSG:
          "Kesalahan mengirim pesan WhatsApp. Periksa halaman koneksi.",
        ERR_DELETE_WAPP_MSG: "Tidak dapat menghapus pesan WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Tidak dapat mengedit pesan WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Sudah ada tiket terbuka untuk kontak ini.",
        ERR_QUEUE_INVALID_CONNECTION:
          "Salah satu koneksi bukan milik perusahaan ini.",
        ERR_WAPP_INVALID_QUEUE:
          "Salah satu antrean bukan milik perusahaan ini.",
        ERR_TICKET_INVALID_CONNECTION:
          "Koneksi yang dipilih tidak kompatibel dengan tiket ini.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "Tiket grup tidak dapat dipindahkan ke koneksi lain.",
        ERR_INVALID_GROUP_MODE: "Mode grup yang dipilih tidak valid.",
        ERR_GROUP_QUEUE_REQUIRED:
          "Pilih setidaknya satu antrean yang diizinkan untuk grup.",
        ERR_GROUP_SERVICE_QUEUE_REQUIRED:
          "Pilih antrean layanan yang diizinkan.",
        ERR_GROUP_CONVERSATION_NOT_TICKET:
          "Grup ini berada dalam mode percakapan dan tidak menerima tindakan layanan.",
        ERR_TICKET_CONNECTION_NOT_CONNECTED: "Koneksi tujuan harus tersambung.",
        ERR_TICKET_TRANSFER_QUEUE_REQUIRED:
          "Pilih antrean saat mengganti koneksi.",
        ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION:
          "Antrean ini tidak tertaut ke koneksi yang dipilih.",
        ERR_SESSION_EXPIRED: "Sesi berakhir. Silakan masuk.",
        ERR_USER_CREATION_DISABLED:
          "Pembuatan pengguna telah dinonaktifkan oleh administrator.",
        ERR_NO_PERMISSION:
          "Anda tidak memiliki izin untuk mengakses sumber daya ini.",
        ERR_DUPLICATED_CONTACT: "Kontak dengan nomor ini sudah ada.",
        ERR_NO_SETTING_FOUND: "Tidak ada pengaturan ditemukan dengan ID ini.",
        ERR_NO_CONTACT_FOUND: "Tidak ada kontak ditemukan dengan ID ini.",
        ERR_NO_TICKET_FOUND: "Tidak ada tiket ditemukan dengan ID ini.",
        ERR_NO_USER_FOUND: "Tidak ada pengguna ditemukan dengan ID ini.",
        ERR_NO_WAPP_FOUND: "Tidak ada WhatsApp ditemukan dengan ID ini.",
        ERR_CREATING_MESSAGE: "Kesalahan membuat pesan dalam basis data.",
        ERR_CREATING_TICKET: "Kesalahan membuat tiket dalam basis data.",
        ERR_FETCH_WAPP_MSG:
          "Kesalahan mengambil pesan dari WhatsApp, mungkin terlalu lama.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Warna ini sudah digunakan, pilih yang lain.",
        ERR_WAPP_GREETING_REQUIRED:
          "Pesan sambutan wajib jika ada lebih dari satu antrian."
      },
      ticketz: {
        registration: {
          header: "Daftar di basis pengguna Espaço Whats",
          description:
            "Isi kolom di bawah ini untuk mendaftar di basis pengguna Espaço Whats dan menerima berita tentang proyek.",
          name: "Nama",
          country: "Negara",
          phoneNumber: "Nomor Telepon",
          submit: "Daftar"
        },
        proAd: {
          imageAlt: "Tangkapan layar Espaço Whats PRO",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "WhatsApp resmi - Instagram - Messenger dan lainnya",
            exclusiveFeatures: "Fitur eksklusif",
            advancedSupport: "Dukungan lanjutan",
            easyMigration: "Migrasi mudah"
          },
          subscribePrice: "Berlangganan seharga {{monthlyPrice}}/bulan",
          subscribeSubtitle: "langsung di dalam sistem",
          ctaUpgrade: "Klik untuk instruksi upgrade",
          ctaVisitSite: "Klik untuk mengunjungi situs",
          instructions: {
            title: "Instruksi upgrade",
            stepIntro:
              "Jika Anda menginstal image yang disediakan proyek di server atau VPS menggunakan instruksi sederhana, Anda hanya perlu mengakses server dan menjalankan perintah di bawah ini:",
            stepInstall:
              'Dalam beberapa saat Espaço Whats PRO akan terpasang dengan semua data Anda; setelah itu buka menu pengguna, klik "Langganan Espaço Whats PRO", lalu selesaikan langganan Anda.',
            helpPrefix:
              "Jika instalasi Anda berbeda atau Anda merasa perlu bantuan untuk memasang Espaço Whats PRO, ",
            helpLink: "hubungi kami",
            helpSuffix: " dan kami akan membantu!"
          }
        },
        support: {
          title: "Dukung proyek Espaço Whats",
          mercadopagotitle: "Kartu Kredit",
          recurringbrl: "Donasi berulang dalam BRL",
          paypaltitle: "Kartu Kredit",
          international: "Donasi dalam USD"
        }
      }
    }
  }
};

export { messages };
