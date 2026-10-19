# Experimento de Status do WhatsApp (modo QR)

Prova exigida pela spec antes de liberar a publicação automática. **Resultado: pendente** (precisa da conta de teste e do celular).

## Ambiente

- `libzapitu-rf`: `1.0.0-alpha.16` (versão do `backend/package-lock.json`)
- Versão WA: `backend/src/waversion.json`
- Script: `backend/src/scripts/whatsappStatusSpike.ts` (aparelho vinculado separado, credenciais em pasta temporária; não usa as sessões do backend)

Auditoria do código do fork, já feita: `sendMessage(jid, content, options)` aceita `broadcast`, `statusJidList`, `backgroundColor`, `font` (`lib/Types/Message.d.ts:205-247`), e repassa `statusJidList` ao `relayMessage`, que trata `status@broadcast` (`lib/Socket/messages-send.js:321-541, 1012`).

## Como rodar (Docker local)

```bash
DC="docker compose -f docker-compose-local.yaml -f docker-compose.localruntime.yaml"
$DC up -d --build backend
# texto
$DC exec -e STATUS_SPIKE_CONFIRM=yes backend node dist/scripts/whatsappStatusSpike.js \
  --auth /tmp/ew-status-spike --to <numero_destinatario_teste> --kind text
# imagem e vídeo: copie o arquivo para dentro do container antes
$DC cp ./teste.jpg backend:/tmp/teste.jpg
$DC exec -e STATUS_SPIKE_CONFIRM=yes backend node dist/scripts/whatsappStatusSpike.js \
  --auth /tmp/ew-status-spike --to <numero> --kind image --file /tmp/teste.jpg
# sem o próprio número na audiência
$DC exec -e STATUS_SPIKE_CONFIRM=yes backend node dist/scripts/whatsappStatusSpike.js \
  --auth /tmp/ew-status-spike --to <numero> --kind text --no-self
```

Leia o QR com o **celular de teste** (Aparelhos conectados). No fim, desvincule o aparelho "Espaço Whats spike" e apague `/tmp/ew-status-spike` no container.

## Resultados

| Tipo | Aparece no celular de teste | Aparece no destinatário | `key.id` | Eventos `status@broadcast` observados |
| --- | --- | --- | --- | --- |
| Texto (azul, fonte 1) | | | | |
| Imagem JPEG | | | | |
| Vídeo MP4 | | | | |
| Texto sem o próprio JID | | | | |

## Decisão

- `1.0.0-alpha.16` já está em `VERIFIED_LIBZAPITU_VERSIONS` (`BaileysStatusProvider.ts`), por decisão do Guilherme em 19/10/2026, para testar no ambiente de dev antes desta prova. Se o texto não aparecer no aparelho, remova a versão da lista para desligar a publicação.
- Tipo que falhar entra em `UNVERIFIED_KINDS`.
- Só marcar "Confirmado" na interface se algum recibo aparecer de forma consistente.
