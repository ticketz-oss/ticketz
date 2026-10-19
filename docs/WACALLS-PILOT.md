# Piloto de chamadas WaCalls

Esta integração é experimental, não oficial e deve permanecer restrita ao tenant
`teste` (empresa `1`) até uma nova decisão. Ela usa uma segunda sessão de dispositivo
vinculado e não substitui nem modifica a conexão de mensagens do Ticketz.

O código do serviço foi incorporado a partir do projeto MIT
[JotaDev66/WaCalls](https://github.com/JotaDev66/WaCalls), revisão
`edeb31f0427aba896639db503153b777a405eccf`. A interface web original do WaCalls
não é publicada.

## Controles de segurança

- A API HTTP do WaCalls existe somente na rede privada do Docker.
- Backend e WaCalls autenticam cada chamada interna com um segredo montado em
  `/run/secrets`; o segredo não fica no Git nem no ambiente salvo no Dokploy.
- O navegador recebe somente um token de mídia assinado, vinculado a tenant,
  usuário e chamada, com validade de dois minutos.
- Todos os endpoints públicos passam pela autenticação do Ticketz, lista de
  permissão de tenant e limites de requisições.
- CORS direto para o WaCalls é bloqueado. O QR só é entregue a administradores.
- Gravação e transcrição são desligadas por padrão e só começam quando o
  atendente aciona o respectivo botão durante uma chamada.
- As gravações ficam no volume privado do backend e são entregues apenas por
  endpoint autenticado. Elas não são enviadas ao WhatsApp.

Os arquivos operacionais ficam em `/etc/dokploy/secrets`:

- `espaco_whats_wacalls.env`: flag global, empresa permitida, IP e faixa UDP;
- `espaco_whats_wacalls_internal_token`: autenticação entre serviços;
- `espaco_whats_wacalls_media_token_secret`: assinatura dos tokens curtos.

Para transcrição de chamadas, configure no ambiente do Compose/Dokploy:

- `GROQ_API_KEY`: chave criada no console da Groq;
- `VOICE_TRANSCRIPTION_PROVIDER=groq` (é o padrão);
- opcionalmente, `OPENAI_API_KEY` e
  `VOICE_TRANSCRIPTION_PROVIDER=openai` para usar a alternativa.

`GROQ_API_KEY` é lida somente do ambiente do backend: ela não deve ser gravada
em configurações de tenant, logs ou Git. A chave `openAiKey` já existente não é
reutilizada para a Groq.

O backend usa `whisper-large-v3-turbo`, áudio WAV mono a 16 kHz e resposta
`verbose_json`. Os canais do atendente e do cliente são transcritos separadamente
e depois intercalados pelos timestamps; assim, os nomes não dependem de
diarização probabilística. Como a Groq considera apenas a primeira faixa de um
arquivo, essa separação também evita perder um dos participantes. No tier gratuito,
os blocos de cinco minutos permanecem abaixo de 25 MB e as solicitações passam por
uma fila de cadência para respeitar 20 RPM. Uma hora de conversa pode consumir até
duas horas de áudio faturável (um canal por participante).

O processamento acontece depois do encerramento da ligação. Se o backend reiniciar
nesse intervalo, itens que estavam em captura ou processamento são retomados na
inicialização. A gravação mista é transferida diretamente para um arquivo privado
temporário e promovida por renomeação atômica quando termina; assim, uma ligação
longa não precisa ser mantida inteira na memória. Antes de iniciar, o backend
também reivindica o artefato por atualização atômica no banco, evitando cobrança
duplicada da Groq quando eventos de encerramento chegam quase ao mesmo tempo.

## Otimização de capacidade

O AudioWorklet agrupa os blocos nativos de 128 amostras em quadros de 960
amostras (60 ms), reduzindo em 7,5 vezes o número de mensagens e conversões entre
navegador e WaCalls. O encoder reutiliza o buffer de saneamento, elimina uma cópia
por quadro e usa uma área de trabalho única na FFT recursiva. As matrizes
trigonométricas da FFT, as janelas/tabelas LPC e as áreas temporárias da busca CELP
são calculadas uma vez e reutilizadas. O cache da FFT ocupa aproximadamente 9,9 MB
fixos, compartilhados por todas as chamadas; as demais áreas são pequenas e isoladas
por encoder.

Em benchmark sintético pareado (`GOMAXPROCS=1`, `GOGC=100`, três amostras de 12 s),
a mediana do encoder caiu de 6,10 ms para 2,07 ms por quadro de 60 ms (cerca de 66%).
As alocações caíram de 1.728 para 583 por quadro (66%) e os bytes de 1,28 MB para
0,71 MB (45%). O teste de regressão codifica 80 quadros variados e exige o mesmo
SHA-256 da versão anterior, garantindo saída binária idêntica. Esses números medem
somente o encoder; o ganho real do serviço deve ser confirmado com chamadas
simultâneas no tenant de teste.

`GOMEMLIMIT` fica explicitamente limitado, mas `GOGC` permanece em 100 por padrão:
o ensaio isolado não confirmou vantagem estável para 200. Escala horizontal em
workers de voz continua sendo a etapa seguinte antes de liberar muitos tenants.

## Fluxo funcional

O administrador liga “Chamadas experimentais” em **Configurações > Empresas**.
No tenant habilitado, **Configurações > Chamadas experimentais** exige a confirmação
do risco e gera o segundo QR. Chamadas recebidas tocam apenas para atendentes online
associados às filas da conexão de mensagens correspondente. O primeiro aceite é
protegido por transação e bloqueio de linha; os demais recebem conflito e param de
tocar. Após 30 segundos, ou sem atendente online, a chamada vira `missed` e é
recusada no upstream.

Ao atender, o sistema resolve o LID/número contra os contatos existentes; quando
não encontra, cria o contato. Uma ocorrência com canal `voice` é criada em
Atendimentos, vinculada ao contato, fila e atendente, sem enviar mensagem externa.
Ao término ela é fechada e aparece em Resolvidos com a duração. Se habilitados,
gravação e transcrição são anexadas a esse mesmo histórico.

A criação e o fechamento desse histórico usam bloqueio de linha e são
idempotentes. Se o evento de encerramento coincidir com a criação do ticket, ou
se o backend reiniciar nesse intervalo, a inicialização recupera chamadas aceitas
com ticket ausente/aberto e conclui o fechamento sem duplicar a ocorrência.

Estados persistidos: `ringing`, `accepted`, `rejected`, `missed`, `ended` e
`failed`. São armazenados número, contato, atendimento, conexão, filas, atendente,
horários, duração, estado dos artefatos e erro técnico.

## Verificação do piloto

Antes de expandir, executar e registrar:

1. Pareamento por QR e restauração após reiniciar backend e WaCalls.
2. Chamada atendida com áudio bidirecional em Wi-Fi.
3. Chamada atendida com áudio bidirecional em 4G/5G.
4. Microfone negado, queda de rede, recusa e timeout de 30 segundos.
5. Dois atendentes aceitando ao mesmo tempo; somente um deve obter a chamada.
6. Tentativa pelo tenant não permitido; deve retornar `403`.
7. Uma chamada contínua de 30 minutos.
8. Envio e recebimento de mensagens antes e depois dos testes.
9. Nome de contato conhecido e criação de um contato ainda desconhecido.
10. Histórico `Ligação` em aberto e fechamento em Resolvidos, sem mensagem no celular.
11. Gravação privada e transcrição Groq com os dois participantes identificados.
12. Arrastar o cartão da chamada e continuar usando as demais telas.

Monitorar `docker stats`, saúde dos containers, eventos `failed`, chamadas perdidas,
desconexões e relatos de áudio. A expansão fica bloqueada se desconexões superarem
2% ou falhas de áudio superarem 1%. Qualquer alerta de ferramenta não autorizada,
suspensão ou banimento encerra o piloto imediatamente.

## Rollback

O rollback funcional é reversível: definir `WACALLS_ENABLED=false` no arquivo
`/etc/dokploy/secrets/espaco_whats_wacalls.env` e redesplegar o Compose. Isso não
altera a conexão de mensagens. Para remover o dispositivo vinculado, use o botão
“Desligar e desvincular” antes de desabilitar o switch do tenant.

Se uma versão precisar ser revertida, mova a branch `deploy` para o último commit
aprovado e aguarde os health checks do Dokploy. Não apague o volume `wacalls_data`
durante um rollback normal; ele contém a sessão pareada.
