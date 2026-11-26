/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   
   BASIC LICENSE INFORMATION:

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   Licensed under the AGPLv3 as stated on LICENSE.md file
   
   Any work that uses code from this file is obligated to 
   give access to its source code to all of its users (not only
   the system's owner running it)
   
   EXCLUSIVE LICENSE to use on closed source derived work can be
   purchased from the author and put at the root of the source
   code tree as proof-of-purchase.



   INFORMAÇÕES BÁSICAS DE LICENÇA

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Licenciado sob a licença AGPLv3 conforme arquivo LICENSE.md
    
   Qualquer sistema que inclua este código deve ter o seu código
   fonte fornecido a todos os usuários do sistema (não apenas ao
   proprietário da infraestrutura que o executa)
   
   LICENÇA EXCLUSIVA para uso em produto derivado em código fechado
   pode ser adquirida com o autor e colocada na raiz do projeto
   como prova de compra. 
   
 */

import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap
} from "libzapitu-rf";
import { BufferJSON, initAuthCreds, proto } from "libzapitu-rf";
import Whatsapp from "../models/Whatsapp";
import BaileysSession from "../models/BaileysSession";
import BaileysSessionKey from "../models/BaileysSessionKey";
import {
  StaleBaileysSessionError,
  withActiveBaileysSession
} from "../services/WbotServices/BaileysSessionService";

const authState = async (
  whatsapp: Whatsapp,
  sessionId: string,
  isCurrent: () => boolean
): Promise<{ state: AuthenticationState; saveState: () => Promise<void> }> => {
  let creds: AuthenticationCreds;
  const whatsappId = whatsapp.id;

  const saveState = async () => {
    await withActiveBaileysSession(
      whatsappId,
      sessionId,
      async (_, transaction) => {
        if (!isCurrent()) throw new StaleBaileysSessionError();
        await BaileysSession.update(
          { credentials: JSON.stringify(creds, BufferJSON.replacer) },
          { where: { id: sessionId, whatsappId }, transaction }
        );
      }
    );
  };

  const session = await BaileysSession.findOne({
    where: { id: sessionId, whatsappId }
  });
  if (!session) throw new Error("Baileys session not found");
  if (session.credentials) {
    try {
      creds = JSON.parse(session.credentials, BufferJSON.reviver);
    } catch {
      throw new Error("Malformed Baileys credentials");
    }
    if (!creds || typeof creds !== "object")
      throw new Error("Malformed Baileys credentials");
  } else {
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          ids.forEach(id => {
            data[id] = null;
          });

          await withActiveBaileysSession(
            whatsappId,
            sessionId,
            async (_, transaction) => {
              if (!isCurrent()) throw new StaleBaileysSessionError();
              const entries = await BaileysSessionKey.findAll({
                where: { sessionId, type, key: ids },
                transaction
              });
              entries.forEach(entry => {
                let value;
                try {
                  value = JSON.parse(entry.value, BufferJSON.reviver);
                } catch {
                  throw new Error("Malformed Baileys key data");
                }
                if (value && type === "app-state-sync-key") {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[entry.key] = value;
              });
            }
          );
          return data;
        },
        set: async data => {
          await withActiveBaileysSession(
            whatsappId,
            sessionId,
            async (_, transaction) => {
              if (!isCurrent()) throw new StaleBaileysSessionError();
              await Promise.all(
                Object.entries(data).flatMap(([type, values]) =>
                  Object.entries(values).map(async ([key, value]) => {
                    if (value) {
                      await BaileysSessionKey.upsert(
                        {
                          sessionId,
                          type,
                          key,
                          value: JSON.stringify(value, BufferJSON.replacer)
                        },
                        { transaction }
                      );
                    } else {
                      await BaileysSessionKey.destroy({
                        where: { sessionId, type, key },
                        transaction
                      });
                    }
                  })
                )
              );
            }
          );
        }
      }
    },
    saveState
  };
};

export default authState;
