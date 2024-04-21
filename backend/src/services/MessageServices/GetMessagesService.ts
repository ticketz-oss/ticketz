import AppError from "../../errors/AppError";
import Message from "../../models/Message";

interface Request {
  id: string;
  ticketId: number
}

const GetMessageService = async ({ id, ticketId }: Request): Promise<Message> => {
  const messageExists = await Message.findOne({
    where: { id, ticketId }
  });

  if (!messageExists) {
    throw new AppError("MESSAGE_NOT_FIND");
  }

  return messageExists;
};

export default GetMessageService;
