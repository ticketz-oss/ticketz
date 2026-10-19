import moment from "moment";

// Invoice dates are calendar dates, not UTC instants. Use the same local
// billing day for both compliance and the administrator's notice.
export const subscriptionDeadline = (dueDate: string, gracePeriod: number) =>
  moment(dueDate?.slice(0, 10), "YYYY-MM-DD", true)
    .add(gracePeriod, "days")
    .endOf("day");
