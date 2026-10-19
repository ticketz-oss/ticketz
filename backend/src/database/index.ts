import { Sequelize } from "sequelize-typescript";
import User from "../models/User";
import Setting from "../models/Setting";
import Contact from "../models/Contact";
import ContactTag from "../models/ContactTag";
import ProspeccaoLead from "../models/ProspeccaoLead";
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
import HelpGroup from "../models/HelpGroup";
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
import BaileysContact from "../models/BaileysContact";
import CampaignShipping from "../models/CampaignShipping";
import Announcement from "../models/Announcement";
import AnnouncementUser from "../models/AnnouncementUser";
import AnnouncementQueue from "../models/AnnouncementQueue";
import AnnouncementWhatsapp from "../models/AnnouncementWhatsapp";
import Chat from "../models/Chat";
import ChatUser from "../models/ChatUser";
import ChatMessage from "../models/ChatMessage";
import Invoices from "../models/Invoices";
import Subscriptions from "../models/Subscriptions";
import BaileysKeys from "../models/BaileysKeys";
import UserSocketSession from "../models/UserSocketSession";
import OutOfTicketMessage from "../models/OutOfTicketMessages";
import Translation from "../models/Translation";
import Wavoip from "../models/Wavoip";
import OAuthClient from "../models/OAuthClient";
import OAuthGrant from "../models/OAuthGrant";
import OAuthRefreshToken from "../models/OAuthRefreshToken";
import McpAudit from "../models/McpAudit";
import CommemorativeDate from "../models/CommemorativeDate";
import ScheduleAudienceContact from "../models/ScheduleAudienceContact";
import ScheduleDelivery from "../models/ScheduleDelivery";
import Partner from "../models/Partner";
import PartnerPayout from "../models/PartnerPayout";
import PlatformIdempotencyKey from "../models/PlatformIdempotencyKey";
import PlatformWebhookOutbox from "../models/PlatformWebhookOutbox";
import PlatformAccessToken from "../models/PlatformAccessToken";
import TaskBoardColumn from "../models/TaskBoardColumn";
import TaskBoardTask from "../models/TaskBoardTask";
import TaskBoardEvent from "../models/TaskBoardEvent";
import VoiceConnection from "../models/VoiceConnection";
import VoiceCall from "../models/VoiceCall";
import GroupQueue from "../models/GroupQueue";
import GroupReadState from "../models/GroupReadState";
import PushSubscription from "../models/PushSubscription";
import ProspeccaoAutomation from "../models/ProspeccaoAutomation";
import ProspeccaoSchedule from "../models/ProspeccaoSchedule";
import ProspeccaoExecution from "../models/ProspeccaoExecution";
import AgentTenantPolicy from "../models/AgentTenantPolicy";
import AgentContextAudit from "../models/AgentContextAudit";
import WhatsappStatusPost from "../models/WhatsappStatusPost";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dbConfig = require("../config/database");

const sequelize = new Sequelize(dbConfig);

const models = [
  AgentTenantPolicy,
  AgentContextAudit,
  Partner,
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
  HelpGroup,
  Help,
  TicketTraking,
  Counter,
  UserRating,
  QueueOption,
  Schedule,
  CommemorativeDate,
  ScheduleAudienceContact,
  ScheduleDelivery,
  Tag,
  TicketTag,
  ContactList,
  ContactListItem,
  Campaign,
  CampaignSetting,
  BaileysContact,
  BaileysKeys,
  CampaignShipping,
  Announcement,
  AnnouncementUser,
  AnnouncementQueue,
  AnnouncementWhatsapp,
  Chat,
  ChatUser,
  ChatMessage,
  Invoices,
  OutOfTicketMessage,
  Subscriptions,
  Translation,
  Wavoip,
  OAuthClient,
  OAuthGrant,
  OAuthRefreshToken,
  McpAudit,
  PartnerPayout,
  PlatformIdempotencyKey,
  PlatformWebhookOutbox,
  PlatformAccessToken,
  TaskBoardColumn,
  TaskBoardTask,
  TaskBoardEvent,
  VoiceConnection,
  VoiceCall,
  GroupQueue,
  GroupReadState,
  ProspeccaoAutomation,
  ProspeccaoSchedule,
  ProspeccaoExecution,
  ProspeccaoLead,
  PushSubscription,
  WhatsappStatusPost
];

sequelize.addModels(models);

export default sequelize;
