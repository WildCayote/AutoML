"use client"

import { WandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeatureEngineering } from "@/libb/hooks/useFeatureEngineering";

export function FeatureEngineeringCard({ datasetId }: { datasetId: string | null }) {
  const {
    results,
    isLoading,
    error,
    startFeatureEng,
    fetchEngResults,
  } = useFeatureEngineering(datasetId ?? "");

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Feature Engineering</CardTitle>
        <CardDescription>
          {isLoading ? "Generating feature engineering report..." : "Create and analyze new features"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center p-8">
            <div className="animate-pulse flex space-x-4 mb-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            </div>
            <p>Generating feature engineering report...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <p className="text-red-500 mb-3">{error}</p>
          </div>
        ) : results ? (
          <div className="p-4 border rounded-lg">
            <iframe 
              src={results.url} 
              width="100%" 
              height="500px"
              title="Feature Engineering Visualization"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <WandIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center mb-4">
              No feature engineering report available
            </p>
          </div>
        )}
        
        <div className="flex space-x-3 mt-4">
          <Button variant="outline" size="sm" onClick={startFeatureEng}>
            <WandIcon className="h-4 w-4 mr-2" />
            Start Engineering
          </Button>
          <Button size="sm" onClick={fetchEngResults}>
            <WandIcon className="h-4 w-4 mr-2" />
            Fetch Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}