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
} from "baileys";
import { BufferJSON, initAuthCreds, proto } from "baileys";
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

    if (!baileysKey) {
      logger.debug(
        `Key not found whatsappId: ${whatsappId} type: ${type} key: ${key}`
      );
    }

    return baileysKey?.value ? JSON.parse(baileysKey.value) : null;
  };

  const removeKey = async (type: string, key: string) => {
    logger.debug(
      `Deleting key whatsappId: ${whatsappId} type: ${type} key: ${key}`
    );
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

  if (whatsapp.session) {
    const result = JSON.parse(whatsapp.session, BufferJSON.reviver);
    creds = result.creds;
    const { keys } = result;

    if (Object.keys(keys).length) {
      logger.info("Clearing old format session keys data");
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
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};

          let counter = 0;
          // eslint-disable-next-line no-restricted-syntax
          for await (const id of ids) {
            try {
              let value = await getKey(type, id);
              if (value && type === "app-state-sync-key") {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
              if (value) {
                counter += 1;
              }
            } catch (error) {
              logger.error(`authState (69) -> error: ${error.message}`);
              logger.error(`authState (72) -> stack: ${error.stack}`);
            }
          }

          logger.debug(
            `Keys retrieved: whatsappId: ${whatsappId} type: ${type} Counter: ${counter}/${ids.length}`
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<unknown>[] = [];
          // eslint-disable-next-line no-restricted-syntax, guard-for-in
          for (const category in data) {
            if (category === "pre-key") {
              logger.info({ category: data[category] }, "Setting pre-keys");
            }
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
