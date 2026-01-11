# OpenHoursEditor

Componente React para edição de horários de funcionamento de um negócio, com suporte a regras semanais e exceções/feriados.

## Características

- ✅ Interface intuitiva com abas separadas para horários semanais e exceções
- ✅ **Seleção de fuso horário com detecção automática do navegador**
- ✅ **Nomes dos dias da semana localizados automaticamente usando date-fns** (suporta qualquer idioma do navegador)
- ✅ **Sistema de tradução integrado (i18n)** - suporta português, inglês e espanhol
- ✅ Suporte a múltiplos períodos de funcionamento por dia (ex: manhã e tarde)
- ✅ Configuração flexível de dias da semana
- ✅ Exceções para datas específicas (feriados, eventos especiais)
- ✅ Suporte a repetição anual para feriados fixos
- ✅ Opção de marcar dias como fechados
- ✅ Design responsivo usando Material-UI

## Instalação

O componente já está incluído no projeto. Importe-o assim:

```javascript
import OpenHoursEditor from "../components/OpenHoursEditor";
```

## Uso Básico

```javascript
import React, { useState } from "react";
import OpenHoursEditor from "../components/OpenHoursEditor";

const MyComponent = () => {
  const [openHours, setOpenHours] = useState({
    // timezone será detectado automaticamente do navegador
    weeklyRules: [
      {
        days: ["mon", "tue", "wed", "thu", "fri"],
        hours: [{ from: "09:00", to: "18:00" }],
      },
    ],
    overrides: [],
  });

  return (
    <OpenHoursEditor 
      value={openHours} 
      onChange={setOpenHours} 
    />
  );
};
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `value` | Object | Não | Objeto com os horários atuais (veja schema abaixo). Se não fornecido, usa valores padrão. O timezone será detectado automaticamente do navegador. |
| `onChange` | Function | Não | Callback chamado quando os horários são alterados |

## Schema de Dados

### Estrutura Completa

```javascript
{
  "timezone": "America/Sao_Paulo",
  "weeklyRules": [
    {
      "days": ["mon", "tue", "wed", "thu"],
      "hours": [
        { "from": "09:00", "to": "12:00" },
        { "from": "13:30", "to": "18:00" }
      ]
    },
    {
      "days": ["fri"],
      "hours": [
        { "from": "09:00", "to": "16:00" }
      ]
    },
    {
      "days": ["sat", "sun"],
      "hours": []
    }
  ],
  "overrides": [
    {
      "date": "2025-12-25",
      "repeat": "yearly",
      "closed": true,
      "label": "Natal"
    },
    {
      "date": "2026-01-01",
      "hours": [
        { "from": "10:00", "to": "14:00" }
      ],
      "label": "Ano Novo (horário especial)"
    }
  ]
}
```

### timezone

String com o fuso horário no formato IANA (ex: "America/Sao_Paulo", "Europe/London", "Asia/Tokyo").

- **Detectado automaticamente**: Se não fornecido, o componente detecta automaticamente o timezone do navegador usando `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Lista com os 24 timezones mais comuns disponível para seleção no dropdown
- Suporta busca/filtro no campo de seleção (Autocomplete)
- Timezones incluem: Américas, Europa, Ásia, Oceania e UTC

### weeklyRules

Array de regras semanais. Cada regra contém:

- **`days`** (Array<string>): Dias da semana. Valores possíveis: `"mon"`, `"tue"`, `"wed"`, `"thu"`, `"fri"`, `"sat"`, `"sun"`
- **`hours`** (Array<Object>): Array de períodos de funcionamento. Cada período tem:
  - **`from`** (string): Horário de abertura no formato "HH:MM"
  - **`to`** (string): Horário de fechamento no formato "HH:MM"

**Nota:** Um array vazio de `hours` indica que o estabelecimento está fechado nesses dias.

### overrides

Array de exceções e feriados. Cada exceção contém:

- **`date`** (string, obrigatório): Data no formato "YYYY-MM-DD"
- **`label`** (string, opcional): Descrição da exceção (ex: "Natal", "Carnaval")
- **`repeat`** (string, opcional): Pode ser `"yearly"` para repetir anualmente
- **`closed`** (boolean, opcional): Se `true`, o estabelecimento está fechado nesta data
- **`hours`** (Array<Object>, opcional): Horários especiais para esta data (mesmo formato de `weeklyRules.hours`)

**Nota:** Se `closed: true`, não é necessário incluir `hours`.

## Exemplo Completo em Modal

```javascript
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@material-ui/core";
import OpenHoursEditor from "../components/OpenHoursEditor";

const BusinessHoursModal = ({ open, onClose, initialData, onSave }) => {
  const [openHours, setOpenHours] = useState(initialData);

  const handleSave = () => {
    onSave(openHours);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar Horários de Funcionamento</DialogTitle>
      <DialogContent>
        <OpenHoursEditor value={openHours} onChange={setOpenHours} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

## Casos de Uso Comuns

### 1. Horário Comercial Padrão

```javascript
{
  // timezone detectado automaticamente
  weeklyRules: [
    {
      days: ["mon", "tue", "wed", "thu", "fri"],
      hours: [{ from: "09:00", to: "18:00" }]
    },
    {
      days: ["sat", "sun"],
      hours: []
    }
  ],
  overrides: []
}
```

### 2. Com Intervalo de Almoço

```javascript
{
  weeklyRules: [
    {
      days: ["mon", "tue", "wed", "thu", "fri"],
      hours: [
        { from: "09:00", to: "12:00" },
        { from: "13:00", to: "18:00" }
      ]
    }
  ],
  overrides: []
}
```

### 3. Horários Diferentes por Dia

```javascript
{
  weeklyRules: [
    {
      days: ["mon", "tue", "wed", "thu"],
      hours: [{ from: "09:00", to: "18:00" }]
    },
    {
      days: ["fri"],
      hours: [{ from: "09:00", to: "17:00" }]
    },
    {
      days: ["sat"],
      hours: [{ from: "10:00", to: "14:00" }]
    },
    {
      days: ["sun"],
      hours: []
    }
  ],
  overrides: []
}
```

### 4. Com Feriados

```javascript
{
  weeklyRules: [...],
  overrides: [
    {
      date: "2026-12-25",
      repeat: "yearly",
      closed: true,
      label: "Natal"
    },
    {
      date: "2026-01-01",
      repeat: "yearly",
      closed: true,
      label: "Ano Novo"
    },
    {
      date: "2026-04-21",
      repeat: "yearly",
      closed: true,
      label: "Tiradentes"
    }
  ]
}
```

### 5. Com Timezone Específico

```javascript
{
  timezone: "Europe/London", // Sobrescreve o timezone do navegador
  weeklyRules: [...],
  overrides: [...]
}
```

## Integração com Backend

### Salvando os Horários

```javascript
import api from "../../services/api";

const handleSaveOpenHours = async (openHours) => {
  try {
    await api.post("/api/business-hours", openHours);
    toast.success("Horários salvos com sucesso!");
  } catch (error) {
    toast.error("Erro ao salvar horários");
  }
};
```

### Carregando os Horários

```javascript
import { useEffect, useState } from "react";
import api from "../../services/api";

const MyComponent = () => {
  const [openHours, setOpenHours] = useState(null);

  useEffect(() => {
    const fetchOpenHours = async () => {
      try {
        const { data } = await api.get("/api/business-hours");
        setOpenHours(data);
      } catch (error) {
        console.error("Erro ao carregar horários:", error);
      }
    };

    fetchOpenHours();
  }, []);

  if (!openHours) return <div>Carregando...</div>;

  return <OpenHoursEditor value={openHours} onChange={setOpenHours} />;
};
```

## Validação

O componente não faz validação dos dados internamente. Você pode adicionar validação antes de salvar:

```javascript
const validateOpenHours = (openHours) => {
  // Validar que existe pelo menos uma regra semanal
  if (!openHours.weeklyRules || openHours.weeklyRules.length === 0) {
    return "É necessário definir pelo menos uma regra semanal";
  }

  // Validar que cada regra tem pelo menos um dia
  for (const rule of openHours.weeklyRules) {
    if (!rule.days || rule.days.length === 0) {
      return "Cada regra deve ter pelo menos um dia selecionado";
    }
  }

  // Validar horários
  const validateHours = (hours) => {
    for (const hour of hours) {
      if (hour.from >= hour.to) {
        return "Horário de abertura deve ser anterior ao horário de fechamento";
      }
    }
    return null;
  };

  for (const rule of openHours.weeklyRules) {
    const error = validateHours(rule.hours);
    if (error) return error;
  }

  for (const override of openHours.overrides || []) {
    if (override.hours) {
      const error = validateHours(override.hours);
      if (error) return error;
    }
  }

  return null;
};

// Uso
const handleSave = () => {
  const error = validateOpenHours(openHours);
  if (error) {
    toast.error(error);
    return;
  }
  
  // Salvar...
};
```

## Customização

### Alterando Estilos

Você pode sobrescrever os estilos usando `makeStyles`:

```javascript
import { makeStyles } from "@material-ui/core/styles";

const useCustomStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
  },
}));

const MyComponent = () => {
  const classes = useCustomStyles();
  
  return (
    <div className={classes.root}>
      <OpenHoursEditor {...props} />
    </div>
  );
};
```

## Acessibilidade

O componente usa componentes Material-UI que já incluem suporte a acessibilidade:
- Navegação por teclado
- Labels apropriados
- Contraste de cores adequado

## Dependências

- React 17+
- Material-UI 4.x
- @material-ui/pickers (para seleção de datas)
- @material-ui/icons
- date-fns (para formatação localizada)

## Localização

O componente está totalmente integrado com o sistema de tradução i18n do Ticketz, suportando **português, inglês e espanhol**.

### Dias da Semana

O componente usa `date-fns` para formatar os nomes dos dias da semana de acordo com o **locale do navegador** do usuário. Isso significa que os dias são exibidos no idioma configurado no navegador:

- **Português**: Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo
- **Inglês**: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- **Espanhol**: lunes, martes, miércoles, jueves, viernes, sábado, domingo
- **E qualquer outro idioma suportado pelo navegador**

A detecção do idioma é automática através do `date-fns` e não requer configuração adicional.

### Interface do Usuário

Todos os textos da interface (labels, botões, títulos, etc.) são traduzidos através do sistema i18n:

- **Português** (`pt`): Interface completa em português brasileiro
- **Inglês** (`en`): Interface completa em inglês
- **Espanhol** (`es`): Interface completa em espanhol

O idioma da interface é controlado pelas configurações globais do i18n do Ticketz.

### Chaves de Tradução

As traduções estão organizadas sob a chave `openHours` nos arquivos:
- `/frontend/src/translate/languages/pt.js`
- `/frontend/src/translate/languages/en.js`
- `/frontend/src/translate/languages/es.js`

Exemplo de uso no código:
```javascript
i18n.t("openHours.timezone.label")  // "Fuso Horário" (pt) / "Time Zone" (en) / "Zona Horaria" (es)
i18n.t("openHours.weekly.title")    // "Horários de Funcionamento Semanais" (pt)
i18n.t("openHours.overrides.title") // "Exceções e Feriados" (pt)
```

### Timezone

O campo de fuso horário é detectado automaticamente usando `Intl.DateTimeFormat().resolvedOptions().timeZone`, que retorna o timezone configurado no sistema operacional do usuário. O usuário pode alterar manualmente se necessário através do campo de seleção.

Os timezones disponíveis incluem os mais comuns de:
- Américas (São Paulo, Nova York, Chicago, Los Angeles, etc.)
- Europa (Londres, Paris, Berlim, Madrid, Lisboa, etc.)
- Ásia (Dubai, Kolkata, Xangai, Tóquio, Seul, etc.)
- Oceania (Sydney, Auckland)
- UTC

## Licença

Este componente faz parte do projeto Ticketz e segue a mesma licença do projeto principal.
