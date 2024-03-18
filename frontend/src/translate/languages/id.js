const messages = {
  id: {
    translations: {
      signup: {
        title: "Daftar",
        toasts: {
          success: "Pendaftaran pengguna berhasil! Silakan masuk!!!.",
          fail: "Gagal membuat pengguna. Periksa data yang dimasukkan.",
        },
        form: {
          name: "Nama",
          email: "Email",
          password: "Kata Sandi",
        },
        buttons: {
          submit: "Daftar",
          login: "Sudah punya akun? Masuk!",
        },
      },
      login: {
        title: "Masuk",
        form: {
          email: "Email",
          password: "Kata Sandi",
        },
        buttons: {
          submit: "Masuk",
          register: "Belum punya akun? Daftar!",
        },
      },
      companies: {
        title: "Daftarkan Member",
        form: {
          name: "Nama Member",
          plan: "Paket",
          token: "Token",
          submit: "Daftar",
          success: "Member berhasil dibuat!",
        },
      },
      auth: {
        toasts: {
          success: "Login berhasil dilakukan!",
        },
        token: "Token",
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Pelayanan hari ini: ",
          },
        },
      },
      connections: {
        title: "Koneksi",
        toasts: {
          deleted: "Koneksi dengan WhatsApp berhasil dihapus!",
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Apakah Anda yakin? Tindakan ini tidak dapat dikembalikan.",
          disconnectTitle: "Putuskan",
          disconnectMessage:
            "Apakah Anda yakin? Anda akan perlu membaca ulang Kode QR.",
        },
        buttons: {
          add: "Tambahkan WhatsApp",
          disconnect: "Putuskan",
          tryAgain: "Coba Lagi",
          qrcode: "Kode QR",
          newQr: "Kode QR Baru",
          connecting: "Menghubungkan",
        },
        toolTips: {
          disconnected: {
            title: "Gagal memulai sesi WhatsApp",
            content:
              "Pastikan ponsel Anda terhubung ke internet dan coba lagi, atau minta Kode QR baru",
          },
          qrcode: {
            title: "Menunggu pembacaan Kode QR",
            content:
              "Klik tombol 'Kode QR' dan baca Kode QR dengan ponsel Anda untuk memulai sesi",
          },
          connected: {
            title: "Koneksi berhasil!",
          },
          timeout: {
            title: "Koneksi dengan ponsel hilang",
            content:
              "Pastikan ponsel Anda terhubung ke internet dan WhatsApp terbuka, atau klik tombol 'Putuskan' untuk mendapatkan Kode QR baru",
          },
        },
        table: {
          name: "Nama",
          status: "Status",
          lastUpdate: "Pembaruan Terakhir",
          default: "Standar",
          actions: "Tindakan",
          session: "Sesi",
        },
      },
      internalChat:{
        title: "Chat Internal"
          
      },
      whatsappModal: {
        title: {
          add: "Tambahkan WhatsApp",
          edit: "Edit WhatsApp",
        },
        form: {
          name: "Nama",
          default: "Default",
        },
        buttons: {
          okAdd: "Tambahkan",
          okEdit: "Simpan",
          cancel: "Batal",
        },
        success: "WhatsApp berhasil disimpan.",
      },
      qrCode: {
        message: "Baca Kode QR untuk memulai sesi",
      },
      contacts: {
        title: "Kontak",
        toasts: {
          deleted: "Kontak berhasil dihapus!",
        },
        searchPlaceholder: "Cari...",
        confirmationModal: {
          deleteTitle: "Hapus ",
          importTitlte: "Impor kontak",
          deleteMessage: "Apakah Anda yakin ingin menghapus kontak ini? Semua layanan yang terkait akan hilang.",
          importMessage: "Apakah Anda ingin mengimpor semua kontak dari telepon?",
        },
        buttons: {
          import: "Impor Kontak",
          add: "Tambah Kontak",
        },
        table: {
          name: "Nama",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Tindakan",
        },
      },
      contactModal: {
        title: {
          add: "Tambahkan kontak",
          edit: "Edit kontak",
        },
        form: {
          mainInfo: "Info utama kontak",
          extraInfo: "Info tambahan",
          name: "Nama",
          number: "Nomor WhatsApp",
          email: "Email",
          extraName: "Nama tambahan",
          extraValue: "Nilai",
        },
        buttons: {
          addExtraInfo: "Tambahkan info",
          okAdd: "Tambahkan",
          okEdit: "Simpan",
          cancel: "Batal",
        },
        success: "Kontak berhasil disimpan.",
      },
      queueModal: {
        title: {
          add: "Tambahkan antrian",
          edit: "Edit antrian",
        },
        form: {
          name: "Nama",
          color: "Warna",
          greetingMessage: "Pesan salam",
          complationMessage: "Pesan penyelesaian",
          outOfHoursMessage: "Pesan di luar jam kerja",
          ratingMessage: "Pesan penilaian",
          transferMessage: "Pesan transfer",
          token: "Token",
        },
        buttons: {
          okAdd: "Tambahkan",
          okEdit: "Simpan",
          cancel: "Batal",
          attach: "Lampirkan Berkas",
        },
        serviceHours:{
          dayWeek:"Hari dalam Seminggu",
          startTimeA:"Mulai - Shift A",
          endTimeA:"Selesai - Shift A",
          startTimeB:"Mulai - Shift B",
          endTimeB:"Selesai - Shift B",
          monday:"Senin",
          tuesday:"Selasa",
          wednesday:"Rabu",
          thursday:"Kamis",
          friday:"Jumat",
          saturday:"Sabtu",
          sunday:"Ahad",
        }
      },
      userModal: {
        title: {
          add: "Tambahkan pengguna",
          edit: "Edit pengguna",
        },
        form: {
          name: "Nama",
          email: "Email",
          password: "Sandi",
          profile: "Profil",
        },
        buttons: {
          okAdd: "Tambahkan",
          okEdit: "Simpan",
          cancel: "Batal",
        },
        success: "Pengguna berhasil disimpan.",
      },
      scheduleModal: {
        title: {
          add: "Jadwal Baru",
          edit: "Edit Jadwal",
        },
        form: {
          body: "Pesan",
          contact: "Kontak",
          sendAt: "Tanggal Pengiriman",
          sentAt: "Tanggal Terkirim",
        },
        buttons: {
          okAdd: "Tambahkan",
          okEdit: "Simpan",
          cancel: "Batal",
        },
        success: "Jadwal berhasil disimpan.",
      },
      tagModal: {
        title: {
          add: "Tag Baru",
          edit: "Edit Tag",
          addKanban: "Gelanggang Baru",
          editKanban: "Edit Gelanggang",
        },
        form: {
          name: "Nama",
          color: "Warna",
           kanban: "Kanban",
        },
        buttons: {
          okAdd: "Tambahkan",
          okEdit: "Simpan",
          cancel: "Batal",
        },
        success: "Tag berhasil disimpan.",
        successKanban: "Gelanggang berhasil disimpan.",

      },
      chat: {
        noTicketMessage: "Pilih tiket untuk memulai percakapan.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "SERET DAN LEPASKAN BERKAS DI BAWAH INI",
          titleFileList: "Daftar berkas"
        },
      },      
      ticketsManager: {
        buttons: {
          newTicket: "Baru",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Antrian",
      },
      tickets: {
        toasts: {
          deleted: "Pelayanan yang sedang Anda lakukan telah dihapus.",
        },
        notification: {
          message: "Pesan dari",
        },
        tabs: {
          open: { title: "Terbuka" },
          closed: { title: "Ditutup" },
          search: { title: "Cari" },
        },
        search: {
          placeholder: "Cari pelayanan dan pesan",
        },
        buttons: {
          showAll: "Semua",
        },
      },
      transferTicketModal: {
        title: "Transfer Tiket",
        fieldLabel: "Ketik untuk mencari pengguna",
        fieldQueueLabel: "Transfer ke antrian",
        fieldQueuePlaceholder: "Pilih satu antrian",
        noOptions: "Tidak ada pengguna yang ditemukan dengan nama tersebut",
        buttons: {
          ok: "Transfer",
          cancel: "Batal",
        },
      },
      ticketsList: {
        pendingHeader: "Menunggu",
        assignedHeader: "Ditugaskan",
        noTicketsTitle: "Tidak Ada di Sini!",
        noTicketsMessage: "Tidak ada pelayanan yang ditemukan dengan status atau kata kunci tersebut",
        buttons: {
          accept: "Terima",
        },
      },
      newTicketModal: {
        title: "Buat Tiket",
        fieldLabel: "Ketik untuk mencari kontak",
        add: "Tambahkan",
        buttons: {
          ok: "Simpan",
          cancel: "Batal",
        },
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dasbor",
          connections: "Koneksi",
          tickets: "Pelayanan",
          quickMessages: "Pesan Cepat",
          contacts: "Kontak",
          queues: "Antrian & Chatbot",
          tags: "Tag",
          administration: "Administrasi",
          service: "Pelayanan",
          users: "Pengguna",
          settings: "Pengaturan",
          helps: "Bantuan",
          about: "Tentang ticketz",
          messagesAPI: "API",
          schedules: "Jadwal",
          campaigns: "Kampanye",
          annoucements: "Pengumuman",
          chats: "Obrolan Internal",
          financeiro: "Keuangan",
          logout: "Keluar",
          management: "Manajemen",
          kanban: "Kanban"
        },
        appBar: {
          user: {
            profile: "Profil",
            logout: "Keluar",
          },
        },
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Nomor",
          body: "Pesan",
          token: "Token terdaftar",
        },
        mediaMessage: {
          number: "Nomor",
          body: "Nama file",
          media: "Media",
          token: "Token terdaftar",
        },
      },
      notifications: {
        noTickets: "Tidak ada pemberitahuan.",
      },
      quickMessages: {
        title: "Pesan Cepat",
        buttons: {
          add: "Tambah Jawaban Cepat",
        },
        dialog: {
          shortcode: "Kode Singkat",
          message: "Pesan",
        },
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Cari",
        subMenus: {
          list: "Panel",
          tags: "Lanes",
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Terbuka",
        confirmationModal: {
          deleteTitle: "Apakah Anda yakin ingin menghapus Lane ini?",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
        },
        table: {
          name: "Nama",
          color: "Warna",
          tickets: "Tiket",
          actions: "Tindakan",
        },
        buttons: {
          add: "Lane Baru",
        },
        toasts: {
          deleted: "Lane berhasil dihapus.",
        },
      },
      contactLists: {
        title: "Daftar Kontak",
        table: {
          name: "Nama",
          contacts: "Kontak",
          actions: "Tindakan",
        },
        buttons: {
          add: "Daftar Baru",
        },
        dialog: {
          name: "Nama",
          company: "Perusahaan",
          okEdit: "Edit",
          okAdd: "Tambah",
          add: "Tambah",
          edit: "Edit",
          cancel: "Batal",
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
        },
        toasts: {
          deleted: "Catatan berhasil dihapus",
        },
      },
      contactListItems: {
        title: "Kontak",
        searchPlaceholder: "Cari",
        buttons: {
          add: "Tambah Baru",
          lists: "Daftar",
          import: "Impor",
        },
        dialog: {
          name: "Nama",
          number: "Nomor",
          whatsapp: "WhatsApp",
          email: "Surel",
          okEdit: "Edit",
          okAdd: "Tambah",
          add: "Tambah",
          edit: "Edit",
          cancel: "Batal",
        },
        table: {
          name: "Nama",
          number: "Nomor",
          whatsapp: "WhatsApp",
          email: "Surel",
          actions: "Tindakan",
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
          importMessage: "Apakah Anda ingin mengimpor kontak dari lembar kerja ini?",
          importTitlte: "Impor",
        },
        toasts: {
          deleted: "Catatan berhasil dihapus",
        },
      },
      campaigns: {
        title: "Kampanye",
        searchPlaceholder: "Cari",
        buttons: {
          add: "Kampanye Baru",
          contactLists: "Daftar Kontak",
        },
        table: {
          name: "Nama",
          whatsapp: "Koneksi",
          contactList: "Daftar Kontak",
          status: "Status",
          scheduledAt: "Dijadwalkan",
          completedAt: "Selesai",
          confirmation: "Konfirmasi",
          actions: "Tindakan",
        },        
        dialog: {
          new: "Kampanye Baru",
          update: "Edit Kampanye",
          readonly: "Hanya Tampilan",
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
            messagePlaceholder: "Isi pesan",
            whatsapp: "Koneksi WhatsApp",
            status: "Status",
            scheduledAt: "Dijadwalkan",
            confirmation: "Konfirmasi",
            contactList: "Daftar Kontak",
          },
          buttons: {
            add: "Tambah",
            edit: "Perbarui",
            okadd: "Oke",
            cancel: "Batal Disparos",
            restart: "Memulai Ulang Disparos",
            close: "Tutup",
            attach: "Lampirkan Berkas",
          },
        },          
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
        },
        toasts: {
          success: "Operasi berhasil dilakukan",
          cancel: "Kampanye dibatalkan",
          restart: "Kampanye dijalankan ulang",
          deleted: "Data telah dihapus",
        },          
      },
      announcements: {
        title: "Pengumuman",
        searchPlaceholder: "Cari",
        buttons: {
          add: "Tambah Pengumuman Baru",
          contactLists: "Daftar Pengumuman",
        },
        table: {
          priority: "Prioritas",
          title: "Judul",
          text: "Teks",
          mediaName: "Berkas",
          status: "Status",
          actions: "Tindakan",
        },
        dialog: {
          edit: "Edit Pengumuman",
          add: "Pengumuman Baru",
          update: "Edit Pengumuman",
          readonly: "Hanya Tampilan",
          form: {
            priority: "Prioritas",
            title: "Judul",
            text: "Teks",
            mediaPath: "Berkas",
            status: "Status",
          },
          buttons: {
            add: "Tambah",
            edit: "Edit",
            okadd: "Ok",
            cancel: "Batal",
            close: "Tutup",
            attach: "Lampirkan Berkas",
          },
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
        },
        toasts: {
          success: "Operasi berhasil dilakukan",
          deleted: "Data telah dihapus",
        },
      },      
      campaignsConfig: {
        title: "Konfigurasi Kampanye",
      },
      queues: {
        title: "Antrian & Chatbot",
        table: {
          name: "Nama",
          color: "Warna",
          greeting: "Pesan Salam",
          actions: "Tindakan",
        },
        buttons: {
          add: "Tambah Antrian",
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan! Layanan dalam antrian ini akan tetap ada, tetapi tidak akan terhubung ke antrian manapun lagi.",
        },
      },
      queueSelect: {
        inputLabel: "Antrian",
      },
      users: {
        title: "Pengguna",
        table: {
          name: "Nama",
          email: "Email",
          profile: "Profil",
          actions: "Tindakan",
        },
        buttons: {
          add: "Tambah Pengguna",
        },
        toasts: {
          deleted: "Pengguna berhasil dihapus.",
        },
        confirmationModal: {
          deleteTitle: "Hapus",
          deleteMessage: "Semua data pengguna akan hilang. Layanan yang ditangani oleh pengguna ini akan dipindahkan ke antrian.",
        },
      },
      helps: {
        title: "Pusat Bantuan",
      },      
      about: {
        title: "Tentang ticketz",
        abouttitle: "Asal Usul dan Peningkatan",
        aboutdetail: "ticketz adalah turunan tidak langsung dari proyek Whaticket dengan peningkatan yang dibagikan oleh pengembang sistem EquipeChat melalui saluran VemFazer di YouTube, kemudian ditingkatkan oleh Claudemir Todo Bom",
        aboutauthorsite: "Situs Pengarang",
        aboutwhaticketsite: "Situs Komunitas Whaticket di GitHub",
        aboutvemfazersite: "Situs saluran Vem Fazer di GitHub",
        licenseheading: "Lisensi Sumber Terbuka",
        licensedetail: "Ticketz dilisensikan di bawah Lisensi Publik Umum Affero GNU versi 3, ini berarti bahwa setiap pengguna yang memiliki akses ke aplikasi ini berhak untuk mendapatkan akses ke kode sumber. Informasi lebih lanjut dapat ditemukan di tautan di bawah:",
        licensefulltext: "Teks lengkap lisensi",
        licensesourcecode: "Kode sumber ticketz"
      },
      schedules: {
        title: "Jadwal",
        confirmationModal: {
          deleteTitle: "Apakah Anda yakin ingin menghapus Jadwal ini?",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
        },
        table: {
          contact: "Kontak",
          body: "Pesan",
          sendAt: "Tanggal Pengiriman",
          sentAt: "Tanggal Dikirim",
          status: "Status",
          actions: "Tindakan",
        },
        buttons: {
          add: "Jadwal Baru",
        },
        toasts: {
          deleted: "Jadwal berhasil dihapus.",
        },
      },
      tags: {
        title: "Tag",
        confirmationModal: {
          deleteTitle: "Apakah Anda yakin ingin menghapus Tag ini?",
          deleteMessage: "Tindakan ini tidak dapat dibatalkan.",
        },
        table: {
          name: "Nama",
          color: "Warna",
          tickets: "Catatan",
          actions: "Tindakan",
          id: "Id",
          kanban: "Kanban",
        },
        buttons: {
          add: "Tag Baru",
        },
        toasts: {
          deleted: "Tag berhasil dihapus.",
        },
      },      
      settings: {
        success: "Pengaturan berhasil disimpan.",
        title: "Pengaturan",
        settings: {
          userCreation: {
            name: "Pembuatan Pengguna",
            options: {
              enabled: "Aktif",
              disabled: "Nonaktif",
            },
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Ditugaskan kepada:",
          buttons: {
            return: "Kembali",
            resolve: "Selesaikan",
            reopen: "Buka Kembali",
            accept: "Terima",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Ketikkan pesan",
        placeholderClosed: "Buka kembali atau terima tiket ini untuk mengirim pesan.",
        signMessage: "Tandatangani",
      },
      message: {
        edited: "Diedit"
      },
      contactDrawer: {
        header: "Detail Kontak",
        buttons: {
          edit: "Edit Kontak",
        },
        extraInfo: "Informasi Tambahan",
      },
      ticketOptionsMenu: {
        schedule: "Jadwalkan",
        delete: "Hapus",
        transfer: "Transfer",
        registerAppointment: "Catatan Kontak",
        appointmentsModal: {
          title: "Catatan Kontak",
          textarea: "Catatan",
          placeholder: "Masukkan informasi yang ingin Anda catat di sini",
        },
        confirmationModal: {
          title: "Hapus tiket kontak",
          message: "Perhatian! Semua pesan terkait dengan tiket ini akan hilang.",
        },
        buttons: {
          delete: "Hapus",
          cancel: "Batal",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Batal",
        },
      },
      messageOptionsMenu: {
        delete: "Hapus",
        edit: "Edit",
        history: "Riwayat",
        reply: "Balas",
        confirmationModal: {
          title: "Hapus pesan?",
          message: "Tindakan ini tidak dapat dibatalkan.",
        },
      },      
      messageHistoryModal: {
        close: "Tutup",
        title: "Riwayat pengeditan pesan"
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP: "Harus ada setidaknya satu WhatsApp default.",
        ERR_NO_DEF_WAPP_FOUND: "Tidak ada WhatsApp default yang ditemukan. Periksa halaman koneksi.",
        ERR_WAPP_NOT_INITIALIZED: "Sesi WhatsApp ini belum diinisialisasi. Periksa halaman koneksi.",
        ERR_WAPP_CHECK_CONTACT: "Tidak dapat memeriksa kontak WhatsApp. Periksa halaman koneksi.",
        ERR_WAPP_INVALID_CONTACT: "Ini bukan nomor WhatsApp yang valid.",
        ERR_WAPP_DOWNLOAD_MEDIA: "Tidak dapat mengunduh media dari WhatsApp. Periksa halaman koneksi.",
        ERR_INVALID_CREDENTIALS: "Kesalahan autentikasi. Silakan coba lagi.",
        ERR_SENDING_WAPP_MSG: "Kesalahan saat mengirim pesan dari WhatsApp. Periksa halaman koneksi.",
        ERR_DELETE_WAPP_MSG: "Tidak dapat menghapus pesan dari WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Tidak dapat mengedit pesan dari WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Sudah ada tiket terbuka untuk kontak ini.",
        ERR_SESSION_EXPIRED: "Sesi telah berakhir. Silakan masuk kembali.",
        ERR_USER_CREATION_DISABLED: "Pembuatan pengguna dinonaktifkan oleh administrator.",
        ERR_NO_PERMISSION: "Anda tidak memiliki izin untuk mengakses sumber daya ini.",
        ERR_DUPLICATED_CONTACT: "Sudah ada kontak dengan nomor ini.",
        ERR_NO_SETTING_FOUND: "Tidak ada pengaturan yang ditemukan dengan ID ini.",
        ERR_NO_CONTACT_FOUND: "Tidak ada kontak yang ditemukan dengan ID ini.",
        ERR_NO_TICKET_FOUND: "Tidak ada tiket yang ditemukan dengan ID ini.",
        ERR_NO_USER_FOUND: "Tidak ada pengguna yang ditemukan dengan ID ini.",
        ERR_NO_WAPP_FOUND: "Tidak ada WhatsApp yang ditemukan dengan ID ini.",
        ERR_CREATING_MESSAGE: "Kesalahan saat membuat pesan di database.",
        ERR_CREATING_TICKET: "Kesalahan saat membuat tiket di database.",
        ERR_FETCH_WAPP_MSG: "Kesalahan saat mengambil pesan dari WhatsApp, mungkin pesan terlalu lama.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS: "Warna ini sudah digunakan, pilih warna lain.",
        ERR_WAPP_GREETING_REQUIRED: "Salam sapa diperlukan saat ada lebih dari satu antrian.",
      },
    },      
  },
};

export { messages };
