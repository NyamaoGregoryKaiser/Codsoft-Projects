import api from './axios';
import { WebhookSubscription, CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto } from '@/types/webhook';

export const getWebhookSubscriptions = async (): Promise<WebhookSubscription[]> => {
  const response = await api.get<WebhookSubscription[]>('/webhook-subscriptions');
  return response.data;
};

export const createWebhookSubscription = async (data: CreateWebhookSubscriptionDto): Promise<WebhookSubscription> => {
  const response = await api.post<WebhookSubscription>('/webhook-subscriptions', data);
  return response.data;
};

export const updateWebhookSubscription = async (id: string, data: UpdateWebhookSubscriptionDto): Promise<WebhookSubscription> => {
  const response = await api.patch<WebhookSubscription>(`/webhook-subscriptions/${id}`, data);
  return response.data;
};

export const deleteWebhookSubscription = async (id: string): Promise<void> => {
  await api.delete(`/webhook-subscriptions/${id}`);
};