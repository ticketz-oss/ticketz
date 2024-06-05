import User from "../../models/User";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import UpdateDeletedUserOpenTicketsStatus from "../../helpers/UpdateDeletedUserOpenTicketsStatus";

const DeleteUserService = async (
  id: string | number,
  requestUserId: string | number
): Promise<void> => {
  const user = await User.findOne({
    where: { id }
  });

  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === false && user.companyId !== requestUser.companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (user.companyId !== requestUser.companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const userOpenTickets: Ticket[] = await user.$get("tickets", {
    where: { status: "open" }
  });

  if (userOpenTickets.length > 0) {
    UpdateDeletedUserOpenTicketsStatus(userOpenTickets, user.companyId);
  }

  await user.destroy();
};

export default DeleteUserService;
