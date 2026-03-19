'use server';
/**
 * @fileOverview An AI assistant flow for administrators to draft clear, concise, and impactful announcements and suggest optimal urgency levels.
 *
 * - adminAnnouncementAssistant - A function that handles the announcement drafting and suggestion process.
 * - AdminAnnouncementAssistantInput - The input type for the adminAnnouncementAssistant function.
 * - AdminAnnouncementAssistantOutput - The return type for the adminAnnouncementAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  return adminAnnouncementAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminAnnouncementAssistantPrompt',
  input: { schema: AdminAnnouncementAssistantInputSchema },
  output: { schema: AdminAnnouncementAssistantOutputSchema },
  prompt: `You are an AI assistant helping a university administrator draft announcements for students. Your goal is to make the announcements clear, concise, impactful, and appropriately prioritized.

Based on the following draft message and optional context, provide a suggested title, a revised message, and an optimal priority level.

Priority Levels:
- Normal: Standard notifications, general information.
- Urgent: Important but non-critical alerts, requiring timely attention but not immediate action.
- Emergency: Critical, time-sensitive alerts that may override 'Do Not Disturb' mode and require immediate attention (e.g., safety alerts, campus closures).

Draft Message: {{{draftMessage}}}
{{#if context}}
Context: {{{context}}}
{{/if}}

Your response should be in JSON format, strictly adhering to the output schema.`,
});

const adminAnnouncementAssistantFlow = ai.defineFlow(
  {
    name: 'adminAnnouncementAssistantFlow',
    inputSchema: AdminAnnouncementAssistantInputSchema,
    outputSchema: AdminAnnouncementAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
