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
} from "@whiskeysockets/baileys";
import { BufferJSON, initAuthCreds, proto } from "@whiskeysockets/baileys";
import Whatsapp from "../models/Whatsapp";
import BaileysKeys from "../models/BaileysKeys";
import { logger } from "../utils/logger";

const authState = async (
  whatsapp: Whatsapp
): Promise<{ state: AuthenticationState; saveState: () => void }> => {
  let creds: AuthenticationCreds;
  const whatsappId = whatsapp.id;

  const saveKey = async (type: string, key: string, value: any) => {
    logger.debug(
      `Storing key whatsappId: ${whatsappId} type: ${type} key: ${key}`
    );
    return BaileysKeys.upsert({
      whatsappId,
      type,
      key,
      value: JSON.stringify(value)
    });
  };

  const getKey = async (type: string, key: string) => {
    const baileysKey = await BaileysKeys.findOne({
      where: {
        whatsappId,
        type,
        key
      }
    });

    logger.debug(
      `${
        baileysKey ? "Successfull" : "Failed"
      } recover of key whatsappId: ${whatsappId} type: ${type} key: ${key}`
    );

    return baileysKey?.value ? JSON.parse(baileysKey.value) : null;
  };

  const removeKey = async (type: string, key: string) => {
    logger.debug({ type, key }, "Deleting key");
    return BaileysKeys.destroy({
      where: {
        whatsappId,
        type,
        key
      }
    });
  };

  const saveState = async () => {
    try {
      await whatsapp.update({
        session: JSON.stringify({ creds, keys: {} }, BufferJSON.replacer, 0)
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (whatsapp.session && whatsapp.session !== null) {
    const result = JSON.parse(whatsapp.session, BufferJSON.reviver);
    creds = result.creds;
    const { keys } = result;

    // conversion from old format (remove in the future)
    if (Object.keys(keys).length) {
      logger.debug("Starting conversion of keys to new format");
      const TYPE_MAP = {
        preKeys: "pre-key",
        sessions: "session",
        senderKeys: "sender-key",
        appStateSyncKeys: "app-state-sync-key",
        appStateVersions: "app-state-sync-version",
        senderKeyMemory: "sender-key-memory"
      };

      // eslint-disable-next-line no-restricted-syntax
      for await (const oldType of Object.keys(keys)) {
        const newType = TYPE_MAP[oldType];
        logger.debug(`Converting keys of type ${oldType} to ${newType}`);
        // eslint-disable-next-line no-restricted-syntax
        for await (const key of Object.keys(keys[oldType])) {
          await saveKey(newType, key, keys[oldType][key]);
        }
      }
      saveState();
    }
  } else {
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};

          // eslint-disable-next-line no-restricted-syntax
          for await (const id of ids) {
            try {
              let value = await getKey(type, id);
              if (value && type === "app-state-sync-key") {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            } catch (error) {
              logger.error(`authState (69) -> error: ${error.message}`);
              logger.error(`authState (72) -> stack: ${error.stack}`);
            }
          }

          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<unknown>[] = [];
          // eslint-disable-next-line no-restricted-syntax, guard-for-in
          for (const category in data) {
            // eslint-disable-next-line no-restricted-syntax, guard-for-in
            for (const id in data[category]) {
              const value = data[category][id];
              tasks.push(
                value ? saveKey(category, id, value) : removeKey(category, id)
              );
            }
          }

          await Promise.all(tasks);
        }
      }
    },
    saveState
  };
};

export default authState;
