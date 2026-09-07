import { z } from 'zod';

const telegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean().optional(),
  first_name: z.string().optional(),
  username: z.string().optional(),
});

const telegramChatSchema = z.object({
  id: z.number(),
  type: z.string().optional(),
});

const telegramContactSchema = z.object({
  phone_number: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  user_id: z.number().optional(),
});

const telegramMessageSchema = z.object({
  message_id: z.number(),
  from: telegramUserSchema.optional(),
  chat: telegramChatSchema,
  date: z.number().optional(),
  text: z.string().optional(),
  contact: telegramContactSchema.optional(),
});

export const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: telegramMessageSchema.optional(),
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
export type TelegramMessage = z.infer<typeof telegramMessageSchema>;
export type TelegramContact = z.infer<typeof telegramContactSchema>;
