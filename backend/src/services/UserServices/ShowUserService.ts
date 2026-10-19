import User from "../../models/User";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Setting from "../../models/Setting";

const ShowUserService = async (
  id: string | number,
  requestUserId: string | number = null
): Promise<User> => {
  const requestUser = requestUserId ? await User.findByPk(requestUserId) : null;
  const user = await User.findByPk(id, {
    attributes: [
      "name",
      "id",
      "email",
      "profilePicUrl",
      "companyId",
      "profile",
      "visibleScreens",
      "super",
      "tokenVersion"
    ],
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color"]
      },
      {
        model: Company,
        as: "company",
        // `slug` viaja junto porque o frontend decide por ele quem enxerga as
        // telas exclusivas do tenant dono (Central de Cobrança, Prospecção), e
        // este service alimenta o /auth/refresh_token.
        attributes: [
          "id",
          "name",
          "slug",
          "whatsappMode",
          "whatsappStatusEnabled",
          "signupSource",
          "trialStartedAt",
          "trialExpiresAt",
          "trialDays",
          "trialEndsAt",
          "dueDay",
          "dueDate",
          "status",
          "platformStatus"
        ],
        // Only the first-login welcome state, so the app can start empty
        // before its first paint while the welcome builds it. Other company
        // settings stay behind their own authorized endpoints.
        include: [
          {
            model: Setting,
            as: "settings",
            attributes: ["key", "value"],
            where: { key: "welcomeTour" },
            required: false
          }
        ]
      }
    ],
    order: [[{ model: Queue, as: "queues" }, "name", "ASC"]]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  if (
    requestUser &&
    requestUser.super === false &&
    user.companyId !== requestUser.companyId
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  return user;
};

export default ShowUserService;
