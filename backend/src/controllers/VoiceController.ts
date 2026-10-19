import { Request, Response } from "express";
import fs from "fs";
import AppError from "../errors/AppError";
import {
  acceptVoiceCall,
  disconnectVoiceConnection,
  endVoiceCall,
  exchangeVoiceWebRTC,
  listVoiceConnections,
  pairVoiceConnection,
  rejectVoiceCall,
  setVoiceCallArtifactOption
} from "../services/VoiceServices/VoiceService";
import { voiceRecordingPath } from "../services/VoiceServices/VoiceArtifactService";

export const requireVoiceResourceId = (value: string): number => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError("ERR_VOICE_INVALID_RESOURCE_ID", 422);
  }
  return id;
};

export const index = async (req: Request, res: Response): Promise<Response> =>
  res.json(await listVoiceConnections(req.user.companyId));

export const pair = async (req: Request, res: Response): Promise<Response> =>
  res
    .status(201)
    .json(
      await pairVoiceConnection(
        req.user.companyId,
        requireVoiceResourceId(req.params.whatsappId),
        req.body.riskAccepted
      )
    );

export const remove = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await disconnectVoiceConnection(
      req.user.companyId,
      requireVoiceResourceId(req.params.whatsappId)
    )
  );

export const accept = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await acceptVoiceCall(requireVoiceResourceId(req.params.callId), req.user)
  );

export const reject = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await rejectVoiceCall(requireVoiceResourceId(req.params.callId), req.user)
  );

export const end = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await endVoiceCall(requireVoiceResourceId(req.params.callId), req.user)
  );

export const artifact = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await setVoiceCallArtifactOption(
      requireVoiceResourceId(req.params.callId),
      req.user,
      req.body.kind,
      req.body.enabled
    )
  );

export const recording = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const file = await voiceRecordingPath(
    requireVoiceResourceId(req.params.callId),
    req.user.companyId,
    Number(req.user.id),
    req.user.profile
  );
  if (!file || !fs.existsSync(file)) {
    throw new AppError("ERR_VOICE_RECORDING_NOT_FOUND", 404);
  }
  res.setHeader("Content-Type", "audio/wav");
  res.setHeader("Cache-Control", "private, no-store");
  fs.createReadStream(file).pipe(res);
};

export const webrtc = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await exchangeVoiceWebRTC(
      requireVoiceResourceId(req.params.callId),
      req.user,
      req.headers["x-voice-token"],
      req.body.sdp_offer
    )
  );
