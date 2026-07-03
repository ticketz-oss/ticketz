const instructions = {
  de: [
    "Laden Sie die ZIP-Datei der Erweiterung herunter.",
    "Entpacken Sie die ZIP-Datei in einen Ordner auf Ihrem Computer.",
    "Öffnen Sie Google Chrome und rufen Sie chrome://extensions/ auf.",
    "Aktivieren Sie den Entwicklermodus über den Schalter oben rechts.",
    'Klicken Sie auf "Entpackte Erweiterung laden".',
    "Wählen Sie den entpackten dist-Ordner aus.",
    "Die Erweiterung ist jetzt installiert und einsatzbereit."
  ],
  en: [
    "Download the extension ZIP file.",
    "Extract the ZIP file to a folder on your computer.",
    "Open Google Chrome and go to chrome://extensions/.",
    "Enable Developer mode using the toggle in the top-right corner.",
    'Click "Load unpacked".',
    "Select the extracted dist folder.",
    "The extension is now installed and ready to use."
  ],
  es: [
    "Descargue el archivo ZIP de la extensión.",
    "Extraiga el archivo ZIP en una carpeta de su computadora.",
    "Abra Google Chrome y vaya a chrome://extensions/.",
    "Active el Modo de desarrollador con el interruptor de la esquina superior derecha.",
    'Haga clic en "Cargar descomprimida".',
    "Seleccione la carpeta dist extraída.",
    "La extensión está instalada y lista para usar."
  ],
  fr: [
    "Téléchargez le fichier ZIP de l'extension.",
    "Extrayez le fichier ZIP dans un dossier de votre ordinateur.",
    "Ouvrez Google Chrome et allez à chrome://extensions/.",
    "Activez le Mode développeur avec le bouton en haut à droite.",
    'Cliquez sur "Charger l\'extension non empaquetée".',
    "Sélectionnez le dossier dist extrait.",
    "L'extension est installée et prête à l'emploi."
  ],
  id: [
    "Unduh file ZIP ekstensi.",
    "Ekstrak file ZIP ke folder di komputer Anda.",
    "Buka Google Chrome dan akses chrome://extensions/.",
    "Aktifkan Mode pengembang dengan tombol di sudut kanan atas.",
    'Klik "Muat yang tidak dipaketkan".',
    "Pilih folder dist yang telah diekstrak.",
    "Ekstensi telah terpasang dan siap digunakan."
  ],
  it: [
    "Scarica il file ZIP dell'estensione.",
    "Estrai il file ZIP in una cartella del tuo computer.",
    "Apri Google Chrome e vai a chrome://extensions/.",
    "Attiva la Modalità sviluppatore con l'interruttore in alto a destra.",
    'Clicca su "Carica estensione non pacchettizzata".',
    "Seleziona la cartella dist estratta.",
    "L'estensione è installata e pronta all'uso."
  ],
  pt: [
    "Baixe o arquivo ZIP da extensão.",
    "Extraia o arquivo ZIP para uma pasta no seu computador.",
    "Abra o Google Chrome e acesse chrome://extensions/.",
    "Ative o Modo de desenvolvedor usando a chave no canto superior direito.",
    'Clique em "Carregar sem compactação".',
    "Selecione a pasta dist extraída.",
    "A extensão está instalada e pronta para uso."
  ],
  pt_PT: [
    "Transfira o ficheiro ZIP da extensão.",
    "Descompacte o ficheiro ZIP para uma pasta no seu computador.",
    "Abra o Google Chrome e aceda a chrome://extensions/.",
    "Ative o Modo de programador com o botão no canto superior direito.",
    'Clique em "Carregar expandida".',
    "Selecione a pasta dist descompactada.",
    "A extensão está instalada e pronta a usar."
  ]
};

export default function getInstallInstructions(language) {
  const baseLanguage = language?.split("_")[0];
  return (
    instructions[language] || instructions[baseLanguage] || instructions.en
  );
}
