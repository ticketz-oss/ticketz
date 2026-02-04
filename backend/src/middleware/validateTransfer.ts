import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Ticket from "../models/Ticket";

const validateTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newUserId } = req.body;
    const { ticketId } = req.params;
    const { companyId, id: reqUserId } = req.user;

    // Valida se o novo usuário existe e pertence à empresa
    if (newUserId) {
      const newUser = await User.findOne({
        where: { id: newUserId, companyId }
      });

      if (!newUser) {
        return res.status(404).json({ 
          error: "Destination user not found or doesn't belong to your company" 
        });
      }

      // Verifica se o usuário está ativo
      if (newUser.disabled) {
        return res.status(400).json({ 
          error: "Destination user is disabled" 
        });
      }
    }

    // Valida se o ticket existe e pertence à empresa
    const ticket = await Ticket.findOne({
      where: { id: ticketId, companyId }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Adiciona o ticket ao request para uso posterior
    req.ticket = ticket;
    
    next();
  } catch (error) {
    return res.status(500).json({ error: "Validation error" });
  }
};

export default validateTransfer;
