"use client"

import { TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeatureSelection } from "@/libb/hooks/useFeatureSelection";

export function FeatureSelectionCard({ datasetId }: { datasetId: string | null }) {
  const {
    selResults,
    isSelLoading,
    selError,
    startFeatureSel,
    fetchSelResults,
  } = useFeatureSelection(datasetId ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Selection</CardTitle>
        <CardDescription>Identify the most important features in your data</CardDescription>
      </CardHeader>
      <CardContent>
        {isSelLoading ? (
          <div className="flex flex-col items-center p-8">
            <div className="animate-pulse flex space-x-4 mb-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            </div>
            <p>Generating feature selection report...</p>
          </div>
        ) : selError ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <p className="text-red-500 mb-3">{selError}</p>
          </div>
        ) : selResults ? (
          <div className="p-4 border rounded-lg">
            <iframe 
              src={selResults.url} 
              width="100%" 
              height="500px"
              title="Feature Selection Visualization"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <TableIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center mb-4">
              No feature selection report available
            </p>
          </div>
        )}
        
        <div className="flex space-x-3 mt-4">
          <Button variant="outline" size="sm" onClick={startFeatureSel}>
            <TableIcon className="h-4 w-4 mr-2" />
            Start Selection
          </Button>
          <Button size="sm" onClick={fetchSelResults}>
            <TableIcon className="h-4 w-4 mr-2" />
            Fetch Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}