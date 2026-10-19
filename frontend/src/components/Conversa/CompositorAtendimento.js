import React from "react";
import MessageInput from "../MessageInputCustom";

export default function CompositorAtendimento({ ticket }) {
  return (
    <div className="conversa-compositor conversa-compositor--compact">
      <MessageInput ticket={ticket} showTabGroups compact />
    </div>
  );
}
