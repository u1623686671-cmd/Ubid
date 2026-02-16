'use server';

/**
 * @fileOverview Provides an AI-powered alcohol valuation tool.
 *
 * - evaluateAlcoholBidPrice - A function that suggests a fair bid price for an alcohol item.
 * - EvaluateAlcoholBidPriceInput - The input type for the evaluateAlcoholBidPrice function.
 * - EvaluateAlcoholBidPriceOutput - The return type for the evaluateAlcoholBidPrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateAlcoholBidPriceInputSchema = z.object({
  alcoholCharacteristics: z.string().describe('Detailed characteristics of the alcohol item including rarity, distillery, age, and reviews.'),
  marketTrends: z.string().describe('Current market trends for similar items.'),
});
export type EvaluateAlcoholBidPriceInput = z.infer<typeof EvaluateAlcoholBidPriceInputSchema>;

const EvaluateAlcoholBidPriceOutputSchema = z.object({
  suggestedBidPrice: z.number().describe('The AI-suggested fair bid price for the item.'),
  reasoning: z.string().describe('The AI reasoning behind the suggested bid price.'),
});
export type EvaluateAlcoholBidPriceOutput = z.infer<typeof EvaluateAlcoholBidPriceOutputSchema>;

export async function evaluateAlcoholBidPrice(input: EvaluateAlcoholBidPriceInput): Promise<EvaluateAlcoholBidPriceOutput> {
  return evaluateAlcoholBidPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateAlcoholBidPricePrompt',
  input: {schema: EvaluateAlcoholBidPriceInputSchema},
  output: {schema: EvaluateAlcoholBidPriceOutputSchema},
  prompt: `You are an AI assistant that specializes in providing valuation estimates for rare alcohol items based on their characteristics and current market trends.

  Analyze the following item characteristics and market trends to suggest a fair bid price. Provide detailed reasoning for your suggested bid price.

  Item Characteristics: {{{alcoholCharacteristics}}}
  Market Trends: {{{marketTrends}}}
  \nSet the suggestedBidPrice to a number, and the reasoning to the explanation behind that number.
  If you do not have enough information, set the suggestedBidPrice to 0 and explain that you do not have enough information.
  `,
});

const evaluateAlcoholBidPriceFlow = ai.defineFlow(
  {
    name: 'evaluateAlcoholBidPriceFlow',
    inputSchema: EvaluateAlcoholBidPriceInputSchema,
    outputSchema: EvaluateAlcoholBidPriceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
