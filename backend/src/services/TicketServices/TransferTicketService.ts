import Ticket from "../../models/Ticket";
import TicketTraking from "../../models/TicketTraking";
import User from "../../models/User";

interface Request {
    ticketId: number;
    newUserId: number;
    reqUserId: number; // ID do usuário que está realizando a transferência
    companyId: number;
}

const TransferTicketService = async ({
    ticketId,
    newUserId,
    reqUserId,
    companyId
}: Request): Promise<Ticket> => {
    // 1. Busca o ticket e valida a empresa
    const ticket = await Ticket.findOne({
        where: { id: ticketId, companyId },
        include: [{ model: User, as: "user", attributes: ["id", "name"] }] // Inclui dados do dono atual
    });

    if (!ticket) {
        throw new Error("Ticket not found");
    }

    // 2. Valida se o novo usuário existe e pertence à mesma empresa
    const newUser = await User.findOne({
        where: { id: newUserId, companyId }
    });

    if (!newUser) {
        throw new Error("New user not found or does not belong to your company");
    }

    // 3. Evita transferência para o mesmo usuário
    if (ticket.userId === newUserId) {
        throw new Error("Ticket is already assigned to this user");
    }

    const oldUserId = ticket.userId;

    // 4. Atualiza o dono do ticket
    await ticket.update({ userId: newUserId });

    // 5. Registra a ação no histórico (TicketTraking)
    // O modelo TicketTraking provavelmente tem campos como 'userId', 'ticketId', 'action', etc.
    // Você precisa adaptar os campos de acordo com o seu modelo real.
    await TicketTraking.create({
        ticketId: ticket.id,
        userId: oldUserId, // Ou reqUserId, dependendo de quem você quer registrar como responsável pela ação
        transferredTo: newUserId,
        action: "transferred", // Ou um tipo específico
        companyId: companyId
    });

    // 6. Retorna o ticket atualizado com os dados do novo usuário
    await ticket.reload({
        include: [
            { model: User, as: "user", attributes: ["id", "name"] },
            { model: Contact, as: "contact" },
            { model: Queue, as: "queue" }
        ]
    });

    return ticket;
};

export default TransferTicketService;
