'use server';
/**
 * @fileOverview A Genkit flow for generating a creative and engaging student bio based on their interests and academic field.
 *
 * - studentBioGenerator - A function that handles the bio generation process.
 * - StudentBioGeneratorInput - The input type for the studentBioGenerator function.
 * - StudentBioGeneratorOutput - The return type for the studentBioGenerator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentBioGeneratorInputSchema = z.object({
  academicField: z
    .string()
    .describe('The student\'s academic field or major.'),
  interests: z
    .string()
    .describe('A comma-separated list of the student\'s interests.'),
});
export type StudentBioGeneratorInput = z.infer<
  typeof StudentBioGeneratorInputSchema
>;

const StudentBioGeneratorOutputSchema = z.object({
  bio: z.string().describe('A creative and engaging bio for the student profile.'),
});
export type StudentBioGeneratorOutput = z.infer<
  typeof StudentBioGeneratorOutputSchema
>;

export async function studentBioGenerator(
  input: StudentBioGeneratorInput
): Promise<StudentBioGeneratorOutput> {
  return studentBioGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studentBioGeneratorPrompt',
  input: { schema: StudentBioGeneratorInputSchema },
  output: { schema: StudentBioGeneratorOutputSchema },
  prompt: `You are a helpful assistant that generates creative and engaging student bios for a campus connect platform.

Based on the following information, craft a short and appealing bio for a university student's profile.

Academic Field: {{{academicField}}}
Interests: {{{interests}}}

Ensure the bio is concise, positive, and highlights their unique personality and academic pursuits.`, 
});

const studentBioGeneratorFlow = ai.defineFlow(
  {
    name: 'studentBioGeneratorFlow',
    inputSchema: StudentBioGeneratorInputSchema,
    outputSchema: StudentBioGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
