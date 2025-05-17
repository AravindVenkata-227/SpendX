'use server';
/**
 * @fileOverview Generates personalized spending insights and determines if they should be sent to the user.
 *
 * - generateSpendingInsight - A function that generates a spending insight.
 * - SpendingInsightInput - The input type for the generateSpendingInsight function.
 * - SpendingInsightOutput - The return type for the generateSpendingInsight function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingInsightInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A string containing spending data, including categories, amounts, and time periods.'
    ),
  userPreferences: z
    .string()
    .describe('A string containing user preferences for receiving notifications.'),
});
export type SpendingInsightInput = z.infer<typeof SpendingInsightInputSchema>;

const SpendingInsightOutputSchema = z.object({
  insight: z.string().describe('The generated spending insight.'),
  sendNotification: z
    .boolean()
    .describe(
      'Whether a notification should be sent to the user based on the insight and their preferences.'
    ),
});
export type SpendingInsightOutput = z.infer<typeof SpendingInsightOutputSchema>;

const generateInsightPrompt = ai.definePrompt({
  name: 'generateInsightPrompt',
  input: {schema: SpendingInsightInputSchema},
  output: {schema: SpendingInsightOutputSchema},
  prompt: `You are an AI assistant that analyzes spending data and generates personalized insights.

  You will use the spending data and user preferences to generate a concise and actionable spending insight.  You must ALWAYS generate an insight.

  Based on the insight and user preferences, you will determine whether a notification should be sent to the user.  You MUST carefully consider the user's preferences, and only send a notification if it is likely to lead to improved financial decision making.

  Spending Data: {{{spendingData}}}
  User Preferences: {{{userPreferences}}}
  Insight:  {{output insight}}
  Send Notification: {{output sendNotification}}`,
});

export async function generateSpendingInsight(input: SpendingInsightInput): Promise<SpendingInsightOutput> {
  return spendingInsightsFlow(input);
}

const spendingInsightsFlow = ai.defineFlow(
  {
    name: 'spendingInsightsFlow',
    inputSchema: SpendingInsightInputSchema,
    outputSchema: SpendingInsightOutputSchema,
  },
  async input => {
    const {output} = await generateInsightPrompt(input);
    return output!;
  }
);
