'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const AdminAnnouncementAssistantInputSchema = z.object({
  draftMessage: z
    .string()
    .describe('The initial draft of the announcement message.'),
  context: z
    .string()
    .optional()
    .describe('Additional context for the announcement, e.g., current events or target audience.'),
});
export type AdminAnnouncementAssistantInput = z.infer<typeof AdminAnnouncementAssistantInputSchema>;

const AdminAnnouncementAssistantOutputSchema = z.object({
  suggestedTitle: z
    .string()
    .describe('A concise and impactful suggested title for the announcement.'),
  revisedMessage: z
    .string()
    .describe('The revised, clear, and concise announcement message.'),
  suggestedPriority: z
    .enum(['Normal', 'Urgent', 'Emergency'])
    .describe(
      "The suggested priority level for the announcement: 'Normal' for standard notifications, 'Urgent' for important but non-critical alerts, or 'Emergency' for critical, time-sensitive alerts requiring immediate attention."
    ),
});
export type AdminAnnouncementAssistantOutput = z.infer<typeof AdminAnnouncementAssistantOutputSchema>;

export async function adminAnnouncementAssistant(input: AdminAnnouncementAssistantInput): Promise<AdminAnnouncementAssistantOutput> {
  const parsed = AdminAnnouncementAssistantInputSchema.parse(input);

  const prompt = `You are an AI assistant helping create effective campus announcements. Given the following draft message${parsed.context ? ` and context: "${parsed.context}"` : ''}, please:

1. Suggest a concise, impactful title (max 50 characters)
2. Revise the message to be clear, concise, and professional
3. Determine the priority level: Normal, Urgent, or Emergency

Draft message: "${parsed.draftMessage}"

Respond with the title, revised message, and priority.`;

  const result = await ai.generate({
    prompt,
    output: { schema: AdminAnnouncementAssistantOutputSchema },
  });

  return result.output || {
    suggestedTitle: parsed.draftMessage.slice(0, 48) || 'Campus Announcement',
    revisedMessage: parsed.draftMessage.trim(),
    suggestedPriority: parsed.context?.toLowerCase().includes('emergency')
      ? 'Emergency'
      : parsed.draftMessage.toLowerCase().includes('urgent')
      ? 'Urgent'
      : 'Normal',
  };
}
