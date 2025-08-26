import webpush, { PushSubscription } from "web-push";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import WebpushSubscription from "../../models/WebpushSubscription";

export async function sendWebpushNotifications(message: Message) {
  if (message.fromMe || message.mediaType === "wait") {
    return;
  }

  const subscriptions: WebpushSubscription[] = [];

  if (message.ticket.userId) {
    subscriptions.push(
      ...(await WebpushSubscription.findAll({
        where: { userId: message.ticket.userId }
      }))
    );
  } else if (message.ticket.queueId) {
    const queue =
      message.ticket.queue ||
      (await Queue.findByPk(message.ticket.queueId, {
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

  const body = message.body.startsWith('{"ticketzvCard"')
    ? "🪪"
    : message.body || message.mediaType;

  const payload = JSON.stringify({
    body,
    senderName: message.contact.name || message.contact.number,
    profileImage: message.contact.profilePicUrl || undefined,
    image: message.mediaType === "image" ? message.mediaUrl : undefined,
    ticketUuid: message.ticket.uuid
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
