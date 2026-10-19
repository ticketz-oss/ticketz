# Agente Espaço local

O chat do Agente Espaço usa o Hermes instalado no Windows. A interface e o
backend rodam no Espaço Whats; o bridge local encaminha as mensagens ao Hermes.

1. Copie `backend/.env.hermes.example` para `backend/.env.hermes.local` e defina
   uma chave aleatória com pelo menos 32 caracteres. Em
   `HERMES_CHAT_COMPANY_IDS`, informe os IDs dos tenants autorizados.
2. Inicie o Hermes e execute `backend/scripts/start-hermes-chat.ps1` no Windows.
3. Inicie o Espaço Whats com `docker compose -f docker-compose-local.yaml up -d`.
4. Acesse o tenant, abra **Agente Espaço** na barra lateral e envie uma mensagem.

O arquivo `.env.hermes.local` é privado e não entra no Git. Quando o Hermes não
estiver configurado, o chat exibe uma mensagem de indisponibilidade. As demais
telas do agente são uma prévia visual.
