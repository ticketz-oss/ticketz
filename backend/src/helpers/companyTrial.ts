export const companyTrial = (
  company: { trialStartedAt?: Date | string; trialExpiresAt?: Date | string },
  now = new Date()
) => {
  const startsAt = company.trialStartedAt
    ? new Date(company.trialStartedAt)
    : null;
  const endsAt = company.trialExpiresAt
    ? new Date(company.trialExpiresAt)
    : null;
  const active = !!startsAt && !!endsAt && now >= startsAt && now < endsAt;
  return {
    startsAt,
    endsAt,
    status:
      !startsAt || !endsAt
        ? "none"
        : active
          ? "active"
          : now >= endsAt
            ? "expired"
            : "pending"
  };
};
