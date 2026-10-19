import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useDraggable } from "@dnd-kit/core";
import {
  accumulateDragPosition,
  DraggableCallCard
} from "./VoiceCallContext";
import { validVoiceCallId } from "../../helpers/voiceCallId";

jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }) => children,
  useDraggable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    setActivatorNodeRef: jest.fn(),
    transform: null
  }))
}));

jest.mock("../../services/api", () => ({
  post: jest.fn()
}));

jest.mock("../../helpers/voiceWebRTC", () => ({
  openVoiceWebRTC: jest.fn()
}));

jest.mock("../Socket/SocketContext", () => ({
  SocketContext: require("react").createContext(null)
}));

jest.mock("../../translate/i18n", () => ({
  i18n: { t: key => key }
}));

describe("validVoiceCallId", () => {
  test.each([1, "2", Number.MAX_SAFE_INTEGER])(
    "accepts a positive safe integer: %p",
    value => {
      expect(validVoiceCallId(value)).toBe(Number(value));
    }
  );

  test.each([undefined, null, "NaN", 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects an invalid call identifier: %p",
    value => {
      expect(validVoiceCallId(value)).toBeNull();
    }
  );
});

describe("active voice call card", () => {
  const active = {
    contactName: "Cliente Maria",
    number: "5511999999999",
    transcriptionEnabled: false,
    recordingEnabled: true
  };

  beforeEach(() => {
    useDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      setActivatorNodeRef: jest.fn(),
      transform: null
    });
  });

  it("shows contact identity and exposes the artifact controls", () => {
    const onArtifact = jest.fn();
    render(
      <DraggableCallCard
        active={active}
        duration="00:42"
        muted={false}
        busy={false}
        artifactBusy={false}
        onMute={jest.fn()}
        onEnd={jest.fn()}
        onArtifact={onArtifact}
        position={{ x: 0, y: 0 }}
      />
    );

    expect(screen.getByText("Cliente Maria")).toBeTruthy();
    expect(screen.getByText("5511999999999")).toBeTruthy();
    expect(screen.getByText("00:42")).toBeTruthy();
    expect(useDraggable).toHaveBeenCalledWith({ id: "active-voice-call" });

    fireEvent.click(screen.getByLabelText("voiceCalls.transcribe"));
    fireEvent.click(screen.getByLabelText("voiceCalls.record"));
    expect(onArtifact).toHaveBeenNthCalledWith(1, "transcription", true);
    expect(onArtifact).toHaveBeenNthCalledWith(2, "recording", false);
  });

  it("accumulates drag movement between gestures", () => {
    expect(
      accumulateDragPosition({ x: 15, y: -4 }, { x: -3, y: 9 })
    ).toEqual({ x: 12, y: 5 });
  });
});
