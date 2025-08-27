import webpush, { PushSubscription } from "web-push";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import WebpushSubscription from "../../models/WebpushSubscription";
import Ticket from "../../models/Ticket";

async function getTicketSubscriptions(ticket: Ticket) {
  const subscriptions: WebpushSubscription[] = [];

  if (ticket.userId) {
    subscriptions.push(
      ...(await WebpushSubscription.findAll({
        where: { userId: ticket.userId }
      }))
    );
  } else if (ticket.queueId) {
    const queue =
      ticket.queue ||
      (await Queue.findByPk(ticket.queueId, {
        include: [
          {
            model: User,
            as: "users",
            include: ["webpushSubscriptions"]
          }
        ]
      }));

    if (queue) {
      queue.users.forEach(user => {
        subscriptions.push(...user.webpushSubscriptions);
      });
    }
  }
  return subscriptions;
}

export async function sendWebpushNotifications(message: Message) {
  if (message.fromMe || message.mediaType === "wait") {
    return;
  }

  const subscriptions = await getTicketSubscriptions(message.ticket);

  const body = message.body.startsWith('{"ticketzvCard"')
    ? "🪪"
    : message.body || message.mediaType;

  const payload = JSON.stringify({
    body,
    senderName: message.contact.name || message.contact.number,
    profileImage: message.contact.profilePicUrl || undefined,
    image: message.mediaType === "image" ? message.mediaUrl : undefined,
    tag: message.ticket.uuid,
    timestamp: message.createdAt.getTime()
  });

  subscriptions.forEach(subscription => {
    webpush
      .sendNotification(
        subscription.subscriptionData as PushSubscription,
        payload
      )
      .catch((error: any) => {
        if ([404, 410].includes(error.statusCode)) {
          WebpushSubscription.destroy({
            where: { id: subscription.id }
          });
        }
      });
  });
}

export async function clearWebpushNotifications(ticket: Ticket) {
  const payload = JSON.stringify({
    action: "clear-notifications",
    tag: ticket.uuid
  });

  const subscriptions = await getTicketSubscriptions(ticket);

  subscriptions.forEach(subscription => {
    webpush
      .sendNotification(
        subscription.subscriptionData as PushSubscription,
        payload
      )
      .catch((error: any) => {
        if ([404, 410].includes(error.statusCode)) {
          WebpushSubscription.destroy({
            where: { id: subscription.id }
          });
        }
      });
  });
}
