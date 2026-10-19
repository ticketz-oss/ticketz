import { DateTime } from "luxon";
import mcpConfig from "../../config/mcp";
import Company from "../../models/Company";

// Fuso do tenant configurado na tela de agendamentos. É a mesma fonte que o
// ScheduleController usa em /schedules/variables, então o ChatGPT enxerga o
// mesmo horário padrão que o operador vê na tela. Um fuso inválido gravado no
// tenant cai no padrão do MCP em vez de derrubar a leitura.
export const getTenantTimezone = async (companyId: number): Promise<string> => {
  const company = await Company.findByPk(companyId, {
    attributes: ["timezone", "schedules"]
  });
  const configured = company?.timezone || company?.schedules?.timezone;
  return DateTime.now().setZone(configured || mcpConfig.timezone).isValid
    ? configured || mcpConfig.timezone
    : mcpConfig.timezone;
};

export default getTenantTimezone;
