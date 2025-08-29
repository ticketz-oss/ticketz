import { CallingSound } from './callingSound';
import WavoipInstance from "wavoip-api"

function initializeWavoipCallManager() {
  window.wavoipCallingSound = window.wavoipCallingSound || new CallingSound();
  window.wavoipInstances = window.wavoipInstances || {};
}

async function getWavoipInstance(token, disconnect) {
  initializeWavoipCallManager();

  if (!window.wavoipInstances?.[token]?.ready) {
    const wavoipDevice = new WavoipInstance();
    const instance = await wavoipDevice.connect(token);
    window.wavoipInstances[token] = {
      instance,
      disconnect,
      ready: false
    }
    
    instance.socket.on('signaling', (signal) => {
      if (signal?.tag === "accept") {
        window.wavoipCallingSound.stop();
      }
      if (["terminate", "reject"].includes(signal?.tag)) {
        window.wavoipInstances[token].disconnect();
      }
    });

    instance.socket.on('disconnect', () => {
      window.wavoipInstances[token].ready = false;
    });
    
    instance.socket.on('connect', () => {
      window.wavoipInstances[token].ready = true;
    });

    return new Promise((resolve) => {
      instance.socket.once('connect', () => {
        resolve(instance);
      });
    });
  }
  
  window.wavoipInstances[token].disconnect = disconnect;

  return window.wavoipInstances[token].instance;
}

export async function wavoipCall(ticket, disconnect) {
  if (!ticket.whatsapp?.wavoip?.token) {
    throw new Error("Wavoip token is missing in the ticket's WhatsApp data.");
  }

  const wavoipInstance = await getWavoipInstance(ticket.whatsapp.wavoip.token, disconnect);

  wavoipInstance.callStart({
    whatsappid: ticket.contact.number
  }).then(() => {
    window.wavoipCallingSound.start();
  })

  return wavoipInstance;
};

export function wavoipAvailable() {
  return window.location.protocol === "https:" || window.location.hostname === "localhost";
}
