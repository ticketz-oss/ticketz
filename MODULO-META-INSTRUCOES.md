# Módulo Meta API — WhatsApp Business API Oficial
## Guia de Aplicação

---

## Arquivos NOVOS (copiar)

```bash
# Migration
cp migrations/20260608120000-add-meta-api-fields-to-whatsapps.ts \
   solutionzap/backend/src/database/migrations/

# Services
mkdir -p solutionzap/backend/src/services/MetaServices
cp services/MetaServices/SendMetaMessage.ts \
   solutionzap/backend/src/services/MetaServices/
cp services/MetaServices/MetaWebhookHandler.ts \
   solutionzap/backend/src/services/MetaServices/

# Controller do webhook
cp controllers/MetaWebhookController.ts \
   solutionzap/backend/src/controllers/

# Rota do webhook
cp routes/metaRoutes.ts \
   solutionzap/backend/src/routes/

# Frontend
cp frontend/MetaConnectionModal.js \
   solutionzap/frontend/src/components/MetaConnectionModal.js
```

## Arquivos EDITADOS (substituir)

```bash
# Model com campos Meta
cp models/Whatsapp.ts solutionzap/backend/src/models/Whatsapp.ts

# MessageController com branch Meta
cp controllers/MessageController.ts solutionzap/backend/src/controllers/MessageController.ts

# WhatsAppController com suporte a criar conexão Meta
cp controllers/WhatsAppController.ts solutionzap/backend/src/controllers/WhatsAppController.ts

# Routes index (já editado com Meta routes)
cp routes_index.ts solutionzap/backend/src/routes/index.ts
```

## Edição manual no frontend

No arquivo `frontend/src/pages/Connections/index.js`, adicione:

### 1. Import do modal (no topo):
```javascript
import MetaConnectionModal from "../../components/MetaConnectionModal";
```

### 2. State (junto com os outros useState):
```javascript
const [metaModalOpen, setMetaModalOpen] = useState(false);
```

### 3. Handler (junto com os outros handlers):
```javascript
const handleSaveMetaConnection = async (data) => {
  try {
    await api.post("/whatsapp/", {
      ...data,
      channel: "meta",
      queueIds: []
    });
    toast.success("Conexão Meta API criada!");
    setMetaModalOpen(false);
    // Recarregar lista
  } catch (err) {
    toast.error("Erro ao criar conexão Meta");
  }
};
```

### 4. Botão "Nova Meta API" (ao lado do botão existente de nova conexão):
```javascript
<Button
  variant="contained"
  color="secondary"
  onClick={() => setMetaModalOpen(true)}
>
  + Meta API
</Button>
```

### 5. Modal (antes do fechamento do return):
```javascript
<MetaConnectionModal
  open={metaModalOpen}
  onClose={() => setMetaModalOpen(false)}
  onSave={handleSaveMetaConnection}
/>
```

---

## Configuração na Meta

Após instalar e criar a conexão no painel:

1. Acesse https://developers.facebook.com
2. Vá em seu App → WhatsApp → Configuration
3. Configure o Webhook:
   - **Callback URL**: https://seu-dominio.com/backend/webhook/meta
   - **Verify Token**: solutionzap_verify (mesmo valor do VERIFY_TOKEN no .env)
   - **Webhook fields**: marque "messages"
4. Em API Setup, copie Phone Number ID e gere um token permanente

---

## O que funciona após a instalação

- Receber mensagens de texto do WhatsApp via Meta API
- Receber mídias (imagem, vídeo, áudio, documento)
- Enviar mensagens de texto de volta
- Enviar mídias (upload para Meta + envio)
- Enviar templates/HSM (para mensagens fora da janela de 24h)
- Confirmação de leitura automática
- Status de entrega (enviado, entregue, lido, falha)
- Integração com sistema de tickets existente
- Disparo de webhooks N8N em mensagens recebidas
