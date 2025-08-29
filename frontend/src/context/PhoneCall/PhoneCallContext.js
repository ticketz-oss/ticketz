import React, { createContext, useState } from "react";

export const PhoneCallContext = createContext();

export function PhoneCallProvider({ children }) {
  const [currentCall, setCurrentCall] = useState(null);

  const updateCurrentCall = (call) => {
    setCurrentCall((prevCall) => {
      if (prevCall && call) {
        throw new Error("A call is already in progress. Please disconnect before starting a new call.");
      }
      return call;
    });
  };

  const disconnect = () => {
    setCurrentCall((call) => {
      call?.disconnect();
      return null;
    });
  };
  
  const contextValue = { currentCall, updateCurrentCall, disconnect };

  return (
    <PhoneCallContext.Provider value={contextValue}>
      {children}
    </PhoneCallContext.Provider>
  );
}
