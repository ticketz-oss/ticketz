import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import Contact from "../../models/Contact";

interface Request {
  body: string;
  sendAt: Date;
  contactId: number;
  companyId: number;
  userId?: number;
}

const CreateService = async ({
  body,
  sendAt,
  contactId,
  companyId,
  userId
}: Request): Promise<Schedule> => {
  const schema = Yup.object().shape({
    body: Yup.string().required().min(5),
    sendAt: Yup.string().required()
  });

  try {
    await schema.validate({ body, sendAt });
  } catch (err) {
    throw new AppError(err.message);
  }

  const schedule = await Schedule.create(
    {
      body,
      sendAt,
      contactId,
      companyId,
      userId,
      status: "PENDENTE"
    }
  );

  await schedule.reload({
    include: [{ model: Contact, as: "contact" }]
  });

  return schedule;
};

export default CreateService;
