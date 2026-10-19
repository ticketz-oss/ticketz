# Atualizações da instalação de produção

O Compose geral inicia o backend com uma sequência explícita: aguardar o
PostgreSQL, confirmar uma instalação existente, aplicar migrations pendentes e
iniciar o servidor. `scripts/check-production-database.cjs` exige as tabelas de
empresas, usuários e histórico de migrations, além de empresas e usuários
cadastrados. Uma conexão incorreta ou um banco vazio interrompe a inicialização.
O fluxo não executa seeds, importações, restauração de dados ou reset de sessões.

O `agent-redis` guarda sessões e capacidades do agente sem volume, AOF ou
snapshots. Documentos continuam no volume privado existente. A ativação de cada
empresa e a configuração da ponte Hermes são feitas separadamente.

Antes da promoção, guardar o dump, configuração vigente, imagens anteriores e
identidades dos volumes. Restaurar o dump num PostgreSQL isolado e testar as
migrations; não iniciar sessões de WhatsApp nessa cópia. Comparar contagens e
registros de conexões antes e depois. Nunca copiar dados ou segredos do dev para
produção, recriar volumes ou desfazer migrations publicadas para rollback.

O Dokploy usa Docker Compose comum. As opções de rolling update em `deploy`
não garantem zero interrupção nesse modo: há um reinício dos serviços. Construir
as imagens antes da troca e conferir saúde, APIs e conexões depois dela. Em
regressão, retornar às imagens preservadas sem restaurar um dump sobre dados
mais recentes. PostgreSQL e Redis operacionais devem continuar ativos.
