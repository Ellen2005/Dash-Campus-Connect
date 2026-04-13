'use server';
/**
 * @fileOverview A Genkit flow for summarizing long posts in the social feed.
 *
 * - summarizePostContent - A function that summarizes the content of a post.
 * - SummarizePostContentInput - The input type for the summarizePostContent function.
 * - SummarizePostContentOutput - The return type for the summarizePostContent function.
 */

import { z } from 'zod';

const SummarizePostContentInputSchema = z.object({
  postContent: z.string().describe('The full text content of the post to be summarized.'),
});
export type SummarizePostContentInput = z.infer<typeof SummarizePostContentInputSchema>;

const SummarizePostContentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the main points of the post.'),
});
export type SummarizePostContentOutput = z.infer<typeof SummarizePostContentOutputSchema>;

export async function summarizePostContent(input: SummarizePostContentInput): Promise<SummarizePostContentOutput> {
  const { postContent } = SummarizePostContentInputSchema.parse(input);
  const summary = postContent.length > 120 ? `${postContent.slice(0, 120).trim()}...` : postContent;
  return { summary };
}
