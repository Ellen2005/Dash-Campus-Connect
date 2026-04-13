'use server';
/**
 * @fileOverview A Genkit flow for generating a creative and engaging student bio based on their interests and academic field.
 *
 * - studentBioGenerator - A function that handles the bio generation process.
 * - StudentBioGeneratorInput - The input type for the studentBioGenerator function.
 * - StudentBioGeneratorOutput - The return type for the studentBioGenerator function.
 */

import { z } from 'zod';

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
  const { academicField, interests } = StudentBioGeneratorInputSchema.parse(input);
  return {
    bio: `A driven ${academicField} student who is passionate about ${interests} and ready to connect with campus life.`,
  };
}
