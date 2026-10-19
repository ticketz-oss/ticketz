const PROFILE_ORDER = ["admin", "user"];

export const filterUsersByQueue = (users, queueId) => {
  if (queueId === "" || queueId === null || queueId === undefined) {
    return users;
  }

  return users.filter(user =>
    user.queues?.some(queue => String(queue.id) === String(queueId))
  );
};

export const groupUsersByProfile = users => {
  const profiles = [...new Set(users.map(user => user.profile || "user"))];

  profiles.sort((left, right) => {
    const leftIndex = PROFILE_ORDER.indexOf(left);
    const rightIndex = PROFILE_ORDER.indexOf(right);
    const leftOrder = leftIndex === -1 ? PROFILE_ORDER.length : leftIndex;
    const rightOrder = rightIndex === -1 ? PROFILE_ORDER.length : rightIndex;

    return leftOrder - rightOrder || left.localeCompare(right);
  });

  return profiles.map(profile => ({
    profile,
    users: users.filter(user => (user.profile || "user") === profile)
  }));
};
