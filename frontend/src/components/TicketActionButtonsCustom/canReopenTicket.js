const canReopenTicket = (user, ticket) =>
  user?.profile === "admin" ||
  ticket?.user?.id === user?.id ||
  ticket?.userId === user?.id;

export default canReopenTicket;
