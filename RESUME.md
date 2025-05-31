# RESUMO DO PROJETO TICKETZ - FORK NETSTRONG

## 📊 STATUS ATUAL
- ✅ **Fork NetStrong instalado e funcionando** em VPS com HTTPS
- ✅ **Sistema de campanhas descoberto** - já existe robusto sistema nativo
- ✅ **SSL/HTTPS configurado** com Let's Encrypt automático
- 🐛 **BUG IDENTIFICADO**: Campanhas não respeitam configuração do plano
- 🔄 **PRÓXIMO**: Corrigir bug das campanhas e conectar ao GitHub

## 🏗️ ARQUITETURA DESCOBERTA

### Sistema Base
- **Backend**: Node.js/TypeScript (porta 8080)
- **Frontend**: React (porta 3000) 
- **Banco**: PostgreSQL 16
- **Cache**: Redis 7
- **Proxy**: nginx-proxy com Let's Encrypt automático

### Sistema de Campanhas (NATIVO)
**Localização**: `/backend/src/services/CampaignService/`
```
CampaignService/
├── CreateCampaignService.ts
├── DeleteCampaignService.ts  
├── FindAllCampaignService.ts
├── ProcessCampaignService.ts
├── ShowCampaignService.ts
├── StartCampaignService.ts
├── UpdateCampaignService.ts
└── CancelCampaignService.ts
```

**Funcionalidades descobertas**:
- ✅ Criação/edição/exclusão de campanhas
- ✅ Agendamento de envio
- ✅ Processamento em background (queues)
- ✅ Controle por planos (campanhas habilitadas/desabilitadas)
- ✅ Lista de contatos para envio
- ✅ Templates de mensagens
- ✅ Relatórios e estatísticas

## 🔧 CONFIGURAÇÃO VPS ATUAL

### Localização dos Arquivos
```bash
~/ticketz-netstrong/  # Fork NetStrong branch 'netstrong'
```

### Configuração SSL (ACME)
```bash
# Backend
FRONTEND_HOST=dev.netstrong.com.br
EMAIL_ADDRESS=admin@netstrong.com.br
BACKEND_URL=https://dev.netstrong.com.br/backend

# Frontend  
FRONTEND_HOST=dev.netstrong.com.br
VIRTUAL_HOST=dev.netstrong.com.br
LETSENCRYPT_HOST=dev.netstrong.com.br
```

### Execução Atual
```bash
sudo docker compose -f docker-compose-acme.yaml up -d
```

### URLs de Acesso
- **Frontend**: https://dev.netstrong.com.br
- **Backend API**: https://dev.netstrong.com.br/backend
- **Login**: admin@ticketz.host / 123456

## 🐛 BUG IDENTIFICADO E LOCALIZADO

### Problema
Empresas criadas não respeitam configuração de campanhas do plano:
- Plano com "Campanhas: Desabilitadas" → Empresa criada com "Campanhas: Habilitadas"

### Localização do Código
**Arquivo**: `/backend/src/controllers/CompanyController.ts`
**Função**: `store()` - linha ~50-100

**Lógica Atual**:
```typescript
// Se planId fornecido, buscar configuração do plano
if (planId) {
  const plan = await Plan.findByPk(planId);
  if (plan) {
    companyData.campaignsEnabled = plan.campaignsEnabled;
  }
}
```

### Possíveis Causas
1. ❓ Bug na lógica de criação de empresa
2. ❓ Frontend enviando `campaignsEnabled: true` sobrescrevendo plano
3. ❓ Problema na ordem de processamento dos dados

## 📁 ARQUIVOS CHAVE ANALISADOS

### Backend - Controllers
- `CompanyController.ts` - Criação de empresas (BUG AQUI)
- `CampaignController.ts` - Gestão de campanhas
- `PlanController.ts` - Gestão de planos

### Backend - Models  
- `Company.ts` - Model empresa com campo `campaignsEnabled`
- `Plan.ts` - Model plano com campo `campaignsEnabled`
- `Campaign.ts` - Model campanhas

### Backend - Services
- `CompanyService/CreateCompanyService.ts` - Lógica criação empresa
- `CampaignService/*` - Todos os serviços de campanha

### Frontend - Components
- `TicketzRegistry/index.js` - Formulário telemetria (opcional)
- Campanhas components (a descobrir)

## 🔍 DESCOBERTAS IMPORTANTES

### 1. Sistema de Telemetria (OPCIONAL)
- **Trigger**: Formulário de registro no dashboard
- **Dados enviados**: hostname, nome, WhatsApp, email para creator
- **Controle**: Setting `ticketz_registry` na tabela Settings
- **Status**: Desabilitado (não enviado automaticamente)

### 2. Fork NetStrong vs Original
- **Original**: https://github.com/allgood/ticketz  
- **Fork**: https://github.com/netstrong-com-br/ticketz branch `netstrong`
- **Diferenças**: A investigar (possíveis melhorias/correções)

### 3. Estrutura de Planos
```sql
-- Tabela Plans
id | name | users | connections | queues | campaignsEnabled | value
1  | Plano 1 | 10 | 10 | 10 | false | 30.00
```

### 4. Estrutura de Empresas  
```sql
-- Tabela Companies
id | name | email | planId | campaignsEnabled | status
1  | Empresa 1 | - | 1 | true | true  -- BUG: deveria ser false
```

## 🎯 PRÓXIMOS PASSOS DEFINIDOS

### 1. Conectar VPS ao GitHub Fork
```bash
cd ~/ticketz-netstrong
git remote add origin https://github.com/SEU_USER/SEU_FORK.git
git branch -M main
git add .
git commit -m "Initial commit - NetStrong fork working with HTTPS"
git push -u origin main
```

### 2. Investigar e Corrigir Bug Campanhas
- [ ] Conectar VS Code à VPS 
- [ ] Debuggar `CompanyController.store()`
- [ ] Verificar frontend (dados enviados)
- [ ] Testar criação empresa após correção

### 3. Documentar Sistema de Campanhas
- [ ] Mapear todas funcionalidades
- [ ] Criar documentação de uso
- [ ] Comparar com projeto original

### 4. Preparar Pull Request (se aplicável)
- [ ] Limpar código de testes
- [ ] Documentar mudanças
- [ ] Submeter para projeto original

## 📋 COMANDOS ÚTEIS VPS

```bash
# Acessar diretório
cd ~/ticketz-netstrong

# Ver logs em tempo real
sudo docker compose -f docker-compose-acme.yaml logs -f

# Parar sistema
sudo docker compose -f docker-compose-acme.yaml down

# Subir sistema
sudo docker compose -f docker-compose-acme.yaml up -d

# Acessar banco PostgreSQL
docker exec -it ticketz-netstrong-postgres-1 psql -U ticketz -d ticketz

# Ver containers rodando
docker ps
```

## 🔐 CREDENCIAIS

### Sistema
- **Usuario**: admin@ticketz.host
- **Senha**: 123456

### Banco PostgreSQL
- **Host**: localhost (container)
- **Usuario**: ticketz  
- **Senha**: ticketz
- **Database**: ticketz

### SSL/Domain
- **Dominio**: dev.netstrong.com.br
- **SSL**: Let's Encrypt automático
- **Email**: admin@netstrong.com.br

---
**Última atualização**: 31/05/2025 22:30 BRT
**Sistema**: Funcionando com HTTPS ✅
**Status**: Pronto para desenvolvimento do bug fix
