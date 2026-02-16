"use client";

import { useState } from "react";
import {
  evaluateAlcoholBidPrice,
  type EvaluateAlcoholBidPriceOutput,
} from "@/ai/flows/ai-alcohol-valuation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "../ui/badge";

type AIValuationProps = {
  alcoholCharacteristics: string;
  marketTrends: string;
};

export function AIValuation({ alcoholCharacteristics, marketTrends }: AIValuationProps) {
  const [result, setResult] = useState<EvaluateAlcoholBidPriceOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValuation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const valuationResult = await evaluateAlcoholBidPrice({
        alcoholCharacteristics,
        marketTrends,
      });
      setResult(valuationResult);
    } catch (e) {
      setError("An error occurred while getting the valuation.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-secondary/50 border-dashed">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-lg">AI Valuation Tool</CardTitle>
          <Badge variant="outline" className="text-accent border-accent">BETA</Badge>
        </div>
        <CardDescription>
          Get an AI-powered estimate of a fair bid price based on market data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!result && !loading && (
          <Button onClick={handleValuation} disabled={loading} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Get AI Valuation
          </Button>
        )}
        {loading && (
          <div className="flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Analyzing market data...</span>
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {result && (
          <div className="space-y-4 animate-in fade-in-50">
            <div>
              <p className="text-sm text-muted-foreground">Suggested Bid Price</p>
              <p className="text-3xl font-bold text-primary">
                ${result.suggestedBidPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Reasoning</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {result.reasoning}
              </p>
            </div>
             <Button onClick={handleValuation} disabled={loading} variant="link" className="p-0 h-auto">
                Re-evaluate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
