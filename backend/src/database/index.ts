import { Sequelize } from "sequelize-typescript";
import User from "../models/User";
import Setting from "../models/Setting";
import Contact from "../models/Contact";
import ContactTag from "../models/ContactTag";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";
import WhatsappLidMap from "../models/WhatsappLidMap";
import ContactCustomField from "../models/ContactCustomField";
import Message from "../models/Message";
import OldMessage from "../models/OldMessage";
import Queue from "../models/Queue";
import WhatsappQueue from "../models/WhatsappQueue";
import UserQueue from "../models/UserQueue";
import Company from "../models/Company";
import Plan from "../models/Plan";
import TicketNote from "../models/TicketNote";
import QuickMessage from "../models/QuickMessage";
import Help from "../models/Help";
import TicketTraking from "../models/TicketTraking";
import Counter from "../models/Counter";
import UserRating from "../models/UserRating";
import QueueOption from "../models/QueueOption";
import Schedule from "../models/Schedule";
import Tag from "../models/Tag";
import TicketTag from "../models/TicketTag";
import ContactList from "../models/ContactList";
import ContactListItem from "../models/ContactListItem";
import Campaign from "../models/Campaign";
import CampaignSetting from "../models/CampaignSetting";
import Baileys from "../models/Baileys";
import CampaignShipping from "../models/CampaignShipping";
import Announcement from "../models/Announcement";
import Chat from "../models/Chat";
import ChatUser from "../models/ChatUser";
import ChatMessage from "../models/ChatMessage";
import Invoices from "../models/Invoices";
import Subscriptions from "../models/Subscriptions";
import BaileysKeys from "../models/BaileysKeys";
import UserSocketSession from "../models/UserSocketSession";
import OutOfTicketMessage from "../models/OutOfTicketMessages";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbConfig = require("../config/database");

const sequelize = new Sequelize(dbConfig);

const models = [
  Company,
  User,
  UserSocketSession,
  Contact,
  ContactTag,
  Ticket,
  Message,
  OldMessage,
  Whatsapp,
  WhatsappLidMap,
  ContactCustomField,
  Setting,
  Queue,
  WhatsappQueue,
  UserQueue,
  Plan,
  TicketNote,
  QuickMessage,
  Help,
  TicketTraking,
  Counter,
  UserRating,
  QueueOption,
  Schedule,
  Tag,
  TicketTag,
  ContactList,
  ContactListItem,
  Campaign,
  CampaignSetting,
  Baileys,
  BaileysKeys,
  CampaignShipping,
  Announcement,
  Chat,
  ChatUser,
  ChatMessage,
  Invoices,
  OutOfTicketMessage,
  Subscriptions
];

sequelize.addModels(models);

export default sequelize;
