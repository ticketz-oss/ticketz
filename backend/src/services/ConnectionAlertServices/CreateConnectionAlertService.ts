import { format } from "date-fns";
import { Op } from "sequelize";

import Company from "../../models/Company";
import ConnectionAlert from "../../models/ConnectionAlert";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import EmitConnectionAlert from "./EmitConnectionAlert";
import MailService from "./MailService";

interface Request {
  whatsapp: Whatsapp;
  eventType: "disconnected" | "deleted";
  reason?: string;
}

const formatEventLabel = (eventType: string) => {
  return eventType === "deleted" ? "Conexao deletada" : "Conexao desconectada";
};

const CreateConnectionAlertService = async ({
  whatsapp,
  eventType,
  reason
}: Request): Promise<ConnectionAlert> => {
  const occurredAt = new Date();
  const recentAlert = await ConnectionAlert.findOne({
    where: {
      companyId: whatsapp.companyId,
      whatsappId: whatsapp.id,
      eventType,
      reason: reason || null,
      occurredAt: {
        [Op.gte]: new Date(Date.now() - 60 * 1000)
      }
    },
    order: [["id", "DESC"]]
  });

  if (recentAlert) {
    return recentAlert;
  }

  const company =
    whatsapp.company ||
    (await Company.findByPk(whatsapp.companyId, {
      attributes: ["id", "name"]
    }));

  const alert = await ConnectionAlert.create({
    companyId: whatsapp.companyId,
    whatsappId: whatsapp.id,
    eventType,
    connectionName: whatsapp.name || `Conexao ${whatsapp.id}`,
    connectionChannel: whatsapp.channel || "whatsapp",
    occurredAt,
    severity: "critical",
    reason,
    metadata: JSON.stringify({
      companyName: company?.name || "-",
      provider: whatsapp.provider,
      status: whatsapp.status
    })
  });

  const [superUsers, companyAdmins] = await Promise.all([
    User.findAll({
      attributes: ["email"],
      where: { super: true }
    }),
    User.findAll({
      attributes: ["email"],
      where: {
        companyId: whatsapp.companyId,
        profile: "admin"
      }
    })
  ]);

  const recipientEmails = Array.from(
    new Set(
      [...superUsers, ...companyAdmins]
        .map(user => user.email)
        .filter(Boolean)
        .map(email => email.toLowerCase())
    )
  );

  try {
    if (recipientEmails.length > 0) {
      const occurredAtText = format(occurredAt, "dd/MM/yyyy HH:mm:ss");

      await MailService({
        to: recipientEmails,
        subject:
          `[Ticketz] ${formatEventLabel(eventType)} - ` +
          `${company?.name || whatsapp.companyId}`,
        text:
          `${formatEventLabel(eventType)}\n\n` +
          `Nome do Cliente: ${company?.name || "-"}\n` +
          `ID da conexao: ${whatsapp.id}\n` +
          `Tipo da conexao: ${whatsapp.channel || "whatsapp"}\n` +
          `Nome da conexao: ${whatsapp.name || "-"}\n` +
          `Horario da desconexao: ${occurredAtText}\n` +
          `Motivo: ${reason || "-"}`,
        html:
          `<p><strong>${formatEventLabel(eventType)}</strong></p>` +
          `<p>Nome do Cliente: ${company?.name || "-"}</p>` +
          `<p>ID da conexao: ${whatsapp.id}</p>` +
          `<p>Tipo da conexao: ${whatsapp.channel || "whatsapp"}</p>` +
          `<p>Nome da conexao: ${whatsapp.name || "-"}</p>` +
          `<p>Horario da desconexao: ${occurredAtText}</p>` +
          `<p>Motivo: ${reason || "-"}</p>`
      });

      await alert.update({
        emailStatus: "sent",
        recipientCount: recipientEmails.length,
        emailedAt: new Date()
      });
    } else {
      await alert.update({
        emailStatus: "skipped",
        recipientCount: 0,
        emailError: "No recipients found"
      });
    }
  } catch (error: any) {
    await alert.update({
      emailStatus: "failed",
      recipientCount: recipientEmails.length,
      emailError: error?.message || "Unknown mail error"
    });
  }

  await alert.reload();
  EmitConnectionAlert(alert);

  return alert;
};

export default CreateConnectionAlertService;