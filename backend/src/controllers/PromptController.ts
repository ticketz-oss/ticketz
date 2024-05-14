import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import CreatePromptService from "../services/PromptServices/CreatePromptService";
import DeletePromptService from "../services/PromptServices/DeletePromptService";
import ListPromptsService from "../services/PromptServices/ListPromptsService";
import ShowPromptService from "../services/PromptServices/ShowPromptService";
import UpdatePromptService from "../services/PromptServices/UpdatePromptService";
import Whatsapp from "../models/Whatsapp";
import { verify } from "jsonwebtoken";
import authConfig from "../config/auth";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string | number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { pageNumber, searchParam } = req.query as IndexQuery;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { companyId } = decoded as TokenPayload;
  const { prompts, count, hasMore } = await ListPromptsService({ searchParam, pageNumber, companyId });

  return res.status(200).json({ prompts, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { companyId } = decoded as TokenPayload;
  const { name, apiKey, prompt, maxTokens, temperature, promptTokens, completionTokens, totalTokens, queueId, maxMessages,voice,voiceKey,voiceRegion } = req.body;
  const promptTable = await CreatePromptService({ name, apiKey, prompt, maxTokens, temperature, promptTokens, completionTokens, totalTokens, queueId, maxMessages, companyId,voice,voiceKey,voiceRegion });

  const io = getIO();
  io.emit("prompt", {
    action: "update",
    prompt: promptTable
  });

  return res.status(200).json(promptTable);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { promptId } = req.params;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { companyId } = decoded as TokenPayload;
  const prompt = await ShowPromptService({ promptId, companyId });

  return res.status(200).json(prompt);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { promptId } = req.params;
  const promptData = req.body;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { companyId } = decoded as TokenPayload;

  const prompt = await UpdatePromptService({ promptData, promptId: promptId, companyId });

  const io = getIO();
  io.emit("prompt", {
    action: "update",
    prompt
  });

  return res.status(200).json(prompt);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { promptId } = req.params;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { companyId } = decoded as TokenPayload;
  try {
    const { count } = await Whatsapp.findAndCountAll({ where: { promptId: +promptId, companyId } });

    if (count > 0) return res.status(200).json({ message: "Não foi possível excluir! Verifique se este prompt está sendo usado nas conexões Whatsapp!" });

    await DeletePromptService(promptId, companyId);

    const io = getIO();
    io.emit("prompt", {
      action: "delete",
      intelligenceId: +promptId
    });

    return res.status(200).json({ message: "Prompt deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Não foi possível excluir! Verifique se este prompt está sendo usado!" });
  }
};

