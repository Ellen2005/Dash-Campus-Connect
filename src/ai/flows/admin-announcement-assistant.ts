'use server';

import { z } from 'zod';

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
  const suggestedTitle = parsed.draftMessage.slice(0, 48) || 'Campus Announcement';
  const revisedMessage = parsed.draftMessage.trim();
  const suggestedPriority = parsed.context?.toLowerCase().includes('emergency')
    ? 'Emergency'
    : parsed.draftMessage.toLowerCase().includes('urgent')
    ? 'Urgent'
    : 'Normal';

  return {
    suggestedTitle,
    revisedMessage,
    suggestedPriority,
  };
}
