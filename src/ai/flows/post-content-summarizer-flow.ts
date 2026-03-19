'use server';
/**
 * @fileOverview A Genkit flow for summarizing long posts in the social feed.
 *
 * - summarizePostContent - A function that summarizes the content of a post.
 * - SummarizePostContentInput - The input type for the summarizePostContent function.
 * - SummarizePostContentOutput - The return type for the summarizePostContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizePostContentInputSchema = z.object({
  postContent: z.string().describe('The full text content of the post to be summarized.'),
});
export type SummarizePostContentInput = z.infer<typeof SummarizePostContentInputSchema>;

const SummarizePostContentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the main points of the post.'),
});
export type SummarizePostContentOutput = z.infer<typeof SummarizePostContentOutputSchema>;

export async function summarizePostContent(input: SummarizePostContentInput): Promise<SummarizePostContentOutput> {
  return summarizePostContentFlow(input);
}

const summarizePostContentPrompt = ai.definePrompt({
  name: 'summarizePostContentPrompt',
  input: { schema: SummarizePostContentInputSchema },
  output: { schema: SummarizePostContentOutputSchema },
  prompt: `You are an AI assistant designed to provide concise summaries of social media posts.
Your goal is to extract the main points and present them clearly and briefly.

Summarize the following post content:

Post Content: {{{postContent}}}

Summary:`,
});

const summarizePostContentFlow = ai.defineFlow(
  {
    name: 'summarizePostContentFlow',
    inputSchema: SummarizePostContentInputSchema,
    outputSchema: SummarizePostContentOutputSchema,
  },
  async (input) => {
    const { output } = await summarizePostContentPrompt(input);
    return output!;
  }
);
