import { api } from './api';

export type TicketStatus = 'open' | 'awaiting_user' | 'closed';
export type MessageSender = 'user' | 'agent' | 'assistant' | 'system';

export interface SupportMessage {
  id: string;
  sender: MessageSender;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  reference: string;
  category: string;
  subject: string;
  channel: 'chat' | 'email';
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages?: SupportMessage[];
  lastMessage?: { sender: MessageSender; preview: string } | null;
  messageCount?: number;
}

export const SUPPORT_LIMITS = { subjectMin: 3, subjectMax: 150, messageMax: 4000 } as const;

export async function listTickets(): Promise<SupportTicket[]> {
  const res = await api.get<{ data: SupportTicket[] }>('/support/tickets');
  return res.data.data;
}

export async function getTicket(id: string): Promise<SupportTicket> {
  const res = await api.get<{ data: SupportTicket }>(`/support/tickets/${id}`);
  return res.data.data;
}

export async function createTicket(input: {
  category: string; subject: string; message: string; channel: 'chat' | 'email';
}): Promise<SupportTicket> {
  const res = await api.post<{ data: SupportTicket }>('/support/tickets', input);
  return res.data.data;
}

export async function sendMessage(id: string, body: string): Promise<SupportTicket> {
  const res = await api.post<{ data: SupportTicket }>(`/support/tickets/${id}/messages`, { body });
  return res.data.data;
}

export async function setTicketStatus(id: string, action: 'close' | 'reopen'): Promise<SupportTicket> {
  const res = await api.post<{ data: SupportTicket }>(`/support/tickets/${id}/${action}`);
  return res.data.data;
}
