"use client";

import { useProjects } from "@/libb/projects-context"; // Assuming this handles overall project fetching
import { Brain, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { use, useEffect } from "react";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import {
  createProject,
  fetchProjects,
} from "@/libb/features/project/projectActions";
import { refresh } from "@/libb/features/auth/authActions";
import { useRouter } from "next/navigation";

// Import your defined types
// types/model-data.ts

export interface ClassificationReport {
  accuracy: number;
  "macro avg": {
    recall: number;
    support: number;
    "f1-score": number;
    precision: number;
  };
  "weighted avg": {
    recall: number;
    support: number;
    "f1-score": number;
    precision: number;
  };
  [key: string]: any; // For dynamic keys like "1.6905..."
}

export interface TestSetPerformance {
  accuracy: number;
  weighted_f1_score: number;
  full_classification_report: ClassificationReport;
}

export interface BestHyperparameters {
  [key: string]: any; // Hyperparameters can vary
}

export interface ModelPerformance {
  model_name: string;
  best_hyperparameters: BestHyperparameters;
  test_set_performance: TestSetPerformance;
  cross_validation_f1_score: number;
}

export interface TrainingMetadata {
  best_model_info: {
    model_name: string;
    model_uuid: string;
    saved_model_path: string;
    best_hyperparameters: BestHyperparameters;
    test_set_performance: TestSetPerformance;
  };
  all_models_performance: ModelPerformance[];
}

export interface ModelHyperParameter {
  id: string;
  modelId: string;
  metricName: string;
  metricValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelDetail {
  id: string;
  name: string;
  description: string;
  projectId: string;
  model: string;
  trainingType: string;
  training_metadata: TrainingMetadata;
  createdAt: string;
  updatedAt: string;
  modelHyperParameters: ModelHyperParameter[];
  modelPerformances: ModelHyperParameter[]; // Reusing ModelHyperParameter for general metrics
}

export interface Dataset {
  targetColumnName: string;
  projectId: string;
}

export interface FullModelData {
  dataset: Dataset;
  models: ModelDetail[];
}

// Assume you would fetch this data based on the projectId or it's part of the `project` object
// For demonstration, I'm using a direct import of your sample data.
const yourModelDataJson: FullModelData = {
  dataset: {
    targetColumnName: "quality",
    projectId: "0257086c-61b5-4b76-8221-ef8a5144d993",
  },
  models: [
    {
      id: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
      name: "RandomForestClassifier",
      description: "Classical model generated named: RandomForestClassifier for a CLASSIFICATION",
      projectId: "0257086c-61b5-4b76-8221-ef8a5144d993",
      model: "https://automldatastorage.s3.amazonaws.com/6c358b0d-6462-400a-918a-c16fab3a4d0d.pkl",
      trainingType: "CLASSICAL",
      training_metadata: {
        best_model_info: {
          model_name: "RandomForestClassifier",
          model_uuid: "6c358b0d-6462-400a-918a-c16fab3a4d0d.pkl",
          saved_model_path: "files/6c358b0d-6462-400a-918a-c16fab3a4d0d.pkl",
          best_hyperparameters: {
            criterion: "entropy",
            max_depth: 28,
            n_estimators: 864,
            min_samples_split: 2,
          },
          test_set_performance: {
            accuracy: 0.6419213973799127,
            weighted_f1_score: 0.6283150545938102,
            full_classification_report: {
              accuracy: 0.6419213973799127,
              "macro avg": {
                recall: 0.4419947242873409,
                support: 229,
                "f1-score": 0.4753417922283901,
                precision: 0.5791729777601204,
              },
              "weighted avg": {
                recall: 0.6419213973799127,
                support: 229,
                "f1-score": 0.6283150545938102,
                precision: 0.622774816607368,
              },
              "1.690579552637822": {
                recall: 0.4827586206896552,
                support: 29,
                "f1-score": 0.5384615384615384,
                precision: 0.6086956521739131,
              },
              "-0.836997201665685": {
                recall: 0.7525773195876289,
                support: 97,
                "f1-score": 0.73,
                precision: 0.7087378640776699,
              },
              "0.4267911754860685": {
                recall: 0.6413043478260869,
                support: 92,
                "f1-score": 0.6082474226804123,
                precision: 0.5784313725490197,
              },
              "2.9543679297895755": {
                recall: 0.3333333333333333,
                support: 3,
                "f1-score": 0.5,
                precision: 1,
              },
              "-2.1007855788174385": {
                recall: 0,
                support: 8,
                "f1-score": 0,
                precision: 0,
              },
            },
          },
        },
        all_models_performance: [
          {
            model_name: "LogisticRegression",
            best_hyperparameters: {
              C: 600.1316364993893,
              solver: "lbfgs",
            },
            test_set_performance: {
              accuracy: 0.6244541484716157,
              weighted_f1_score: 0.6070670991736316,
              full_classification_report: {
                accuracy: 0.6244541484716157,
                "macro avg": {
                  recall: 0.3591369263821697,
                  support: 229,
                  "f1-score": 0.3600764724020968,
                  precision: 0.3673160173160173,
                },
                "weighted avg": {
                  recall: 0.6244541484716157,
                  support: 229,
                  "f1-score": 0.6070670991736316,
                  precision: 0.5955216544736195,
                },
                "1.690579552637822": {
                  recall: 0.4137931034482759,
                  support: 29,
                  "f1-score": 0.48,
                  precision: 0.5714285714285714,
                },
                "-0.836997201665685": {
                  recall: 0.7731958762886598,
                  support: 97,
                  "f1-score": 0.7246376811594203,
                  precision: 0.6818181818181818,
                },
                "0.4267911754860685": {
                  recall: 0.6086956521739131,
                  support: 92,
                  "f1-score": 0.5957446808510638,
                  precision: 0.5833333333333334,
                },
                "2.9543679297895755": {
                  recall: 0,
                  support: 3,
                  "f1-score": 0,
                  precision: 0,
                },
                "-2.1007855788174385": {
                  recall: 0,
                  support: 8,
                  "f1-score": 0,
                  precision: 0,
                },
              },
            },
            cross_validation_f1_score: 0.5778158352391269,
          },
          {
            model_name: "KNeighborsClassifier",
            best_hyperparameters: {
              p: 1,
              weights: "distance",
              n_neighbors: 19,
            },
            test_set_performance: {
              accuracy: 0.5152838427947598,
              weighted_f1_score: 0.4897464235046809,
              full_classification_report: {
                accuracy: 0.5152838427947598,
                "macro avg": {
                  recall: 0.2737476622513486,
                  support: 229,
                  "f1-score": 0.2737154264625546,
                  precision: 0.3170738440303658,
                },
                "weighted avg": {
                  recall: 0.5152838427947598,
                  support: 229,
                  "f1-score": 0.4897464235046809,
                  precision: 0.4959312400360436,
                },
                "1.690579552637822": {
                  recall: 0.1724137931034483,
                  support: 29,
                  "f1-score": 0.2631578947368421,
                  precision: 0.5555555555555556,
                },
                "-0.836997201665685": {
                  recall: 0.5876288659793815,
                  support: 97,
                  "f1-score": 0.5643564356435643,
                  precision: 0.5428571428571428,
                },
                "0.4267911754860685": {
                  recall: 0.6086956521739131,
                  support: 92,
                  "f1-score": 0.5410628019323671,
                  precision: 0.4869565217391305,
                },
                "2.9543679297895755": {
                  recall: 0,
                  support: 3,
                  "f1-score": 0,
                  precision: 0,
                },
                "-2.1007855788174385": {
                  recall: 0,
                  support: 8,
                  "f1-score": 0,
                  precision: 0,
                },
              },
            },
            cross_validation_f1_score: 0.5102666487927168,
          },
          {
            model_name: "RandomForestClassifier",
            best_hyperparameters: {
              criterion: "entropy",
              max_depth: 28,
              n_estimators: 864,
              min_samples_split: 2,
            },
            test_set_performance: {
              accuracy: 0.6419213973799127,
              weighted_f1_score: 0.6283150545938102,
              full_classification_report: {
                accuracy: 0.6419213973799127,
                "macro avg": {
                  recall: 0.4419947242873409,
                  support: 229,
                  "f1-score": 0.4753417922283901,
                  precision: 0.5791729777601204,
                },
                "weighted avg": {
                  recall: 0.6419213973799127,
                  support: 229,
                  "f1-score": 0.6283150545938102,
                  precision: 0.622774816607368,
                },
                "1.690579552637822": {
                  recall: 0.4827586206896552,
                  support: 29,
                  "f1-score": 0.5384615384615384,
                  precision: 0.6086956521739131,
                },
                "-0.836997201665685": {
                  recall: 0.7525773195876289,
                  support: 97,
                  "f1-score": 0.73,
                  precision: 0.7087378640776699,
                },
                "0.4267911754860685": {
                  recall: 0.6413043478260869,
                  support: 92,
                  "f1-score": 0.6082474226804123,
                  precision: 0.5784313725490197,
                },
                "2.9543679297895755": {
                  recall: 0.3333333333333333,
                  support: 3,
                  "f1-score": 0.5,
                  precision: 1,
                },
                "-2.1007855788174385": {
                  recall: 0,
                  support: 8,
                  "f1-score": 0,
                  precision: 0,
                },
              },
            },
            cross_validation_f1_score: 0.6243503680564026,
          },
          {
            model_name: "GradientBoostingClassifier",
            best_hyperparameters: {
              max_depth: 11,
              n_estimators: 168,
              learning_rate: 0.2880669028233285,
            },
            test_set_performance: {
              accuracy: 0.6200873362445415,
              weighted_f1_score: 0.6119046476501249,
              full_classification_report: {
                accuracy: 0.6200873362445415,
                "macro avg": {
                  recall: 0.4913435035059789,
                  support: 229,
                  "f1-score": 0.4801988487702774,
                  precision: 0.4820152986172404,
                },
                "weighted avg": {
                  recall: 0.6200873362445415,
                  support: 229,
                  "f1-score": 0.6119046476501249,
                  precision: 0.610313912003402,
                },
                "1.690579552637822": {
                  recall: 0.4482758620689655,
                  support: 29,
                  "f1-score": 0.5306122448979592,
                  precision: 0.65,
                },
                "-0.836997201665685": {
                  recall: 0.711340206185567,
                  support: 97,
                  "f1-score": 0.7040816326530612,
                  precision: 0.696969696969697,
                },
                "0.4267911754860685": {
                  recall: 0.6304347826086957,
                  support: 92,
                  "f1-score": 0.5948717948717949,
                  precision: 0.5631067961165048,
                },
                "2.9543679297895755": {
                  recall: 0.6666666666666666,
                  support: 3,
                  "f1-score": 0.5714285714285714,
                  precision: 0.5,
                },
                "-2.1007855788174385": {
                  recall: 0,
                  support: 8,
                  "f1-score": 0,
                  precision: 0,
                },
              },
            },
            cross_validation_f1_score: 0.6235956430505057,
          },
          {
            model_name: "XGBClassifier",
            best_hyperparameters: {
              max_depth: 14,
              n_estimators: 130,
              learning_rate: 0.2512058697815816,
            },
            test_set_performance: {
              accuracy: 0.611353711790393,
              weighted_f1_score: 0.6071619840158194,
              full_classification_report: {
                accuracy: 0.611353711790393,
                "macro avg": {
                  recall: 0.4321723159039038,
                  support: 229,
                  "f1-score": 0.4367685437333853,
                  precision: 0.4438109965635739,
                },
                "weighted avg": {
                  recall: 0.611353711790393,
                  support: 229,
                  "f1-score": 0.6071619840158194,
                  precision: 0.6050873362445415,
                },
                "1.690579552637822": {
                  recall: 0.5172413793103449,
                  support: 29,
                  "f1-score": 0.5660377358490566,
                  precision: 0.625,
                },
                "-0.836997201665685": {
                  recall: 0.6907216494845361,
                  support: 97,
                  "f1-score": 0.6907216494845361,
                  precision: 0.6907216494845361,
                },
                "0.4267911754860685": {
                  recall: 0.6195652173913043,
                  support: 92,
                  "f1-score": 0.59375,
                  precision: 0.57,
                },
                "2.9543679297895755": {
                  recall: 0.3333333333333333,
                  support: 3,
                  "f1-score": 0.3333333333333333,
                  precision: 0.3333333333333333,
                },
                "-2.1007855788174385": {
                  recall: 0,
                  support: 8,
                  "f1-score": 0,
                  precision: 0,
                },
              },
            },
            cross_validation_f1_score: 0.6121762113055305,
          },
        ],
      },
      createdAt: "2025-06-17T21:51:40.140Z",
      updatedAt: "2025-06-17T21:51:40.140Z",
      modelHyperParameters: [
        {
          id: "193aab95-1c7d-482c-8c07-174bc5b1f777",
          modelId: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
          metricName: "n_estimators",
          metricValue: "864",
          createdAt: "2025-06-17T21:51:40.140Z",
          updatedAt: "2025-06-17T21:51:40.140Z",
        },
        {
          id: "3ba7a830-8526-49ff-9fad-28c161b2f847",
          modelId: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
          metricName: "max_depth",
          metricValue: "28",
          createdAt: "2025-06-17T21:51:40.140Z",
          updatedAt: "2025-06-17T21:51:40.140Z",
        },
        {
          id: "dda05250-b432-4e09-a1da-9b1f2c5e2dd5",
          modelId: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
          metricName: "min_samples_split",
          metricValue: "2",
          createdAt: "2025-06-17T21:51:40.140Z",
          updatedAt: "2025-06-17T21:51:40.140Z",
        },
        {
          id: "c54bc502-b236-45fd-850e-9b5aa80a4deb",
          modelId: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
          metricName: "criterion",
          metricValue: "entropy",
          createdAt: "2025-06-17T21:51:40.140Z",
          updatedAt: "2025-06-17T21:51:40.140Z",
        },
      ],
      modelPerformances: [
        {
          id: "dfa0363f-dd08-430f-9da3-abe71dcfede3",
          modelId: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
          metricName: "accuracy",
          metricValue: "0.6419213973799127",
          createdAt: "2025-06-17T21:51:40.140Z",
          updatedAt: "2025-06-17T21:51:40.140Z",
        },
        {
          id: "073c0e3a-16ff-436e-8def-c79bd0a007dd",
          modelId: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
          metricName: "weighted_f1_score",
          metricValue: "0.6283150545938102",
          createdAt: "2025-06-17T21:51:40.140Z",
          updatedAt: "2025-06-17T21:51:40.140Z",
        },
        {
          id: "615c8fb8-bf69-4959-81c8-d0adc102f984",
          modelId: "2f098f1b-2a7c-4e2f-a9e0-e30808ab9365",
          metricName: "full_classification_report",
          metricValue: "[object Object]", // This needs to be parsed as an object if it's a string
          createdAt: "2025-06-17T21:51:40.140Z",
          updatedAt: "2025-06-17T21:51:40.140Z",
        },
      ],
    },
  ],
};

type PageParams = {
  projectId: string[];
};

export default function ModelTrainingPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const router = useRouter();
  const { projects, status: projectStatus, error: projectError } = useAppSelector((state) => state.project);
  const { access_token, refresh_token, error: authError } = useAppSelector((state) => state.auth);
  const unwrappedParams = use(params);
  const project = projects.find((p) => p.id === unwrappedParams.projectId.join("/"));
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (projectError) {
      if (projectError == "Unauthorized") {
        dispatch(refresh());
      }
    }
  }, [projectError, dispatch]); // Added dispatch to dependency array

  useEffect(() => {
    if (access_token) {
      dispatch(fetchProjects())
        .unwrap()
        .then(() => {
          // Handle successful fetch if needed
        });
    }
  }, [access_token, dispatch, router, authError]);

  if (!project) {
    return <div className="p-8 text-center text-gray-700">Project not found. Please ensure the project ID is correct.</div>;
  }

  // Assuming `project` object has a structure that includes the model data
  // For this example, I'll use the imported `yourModelDataJson` directly.
  const modelData = yourModelDataJson.models[0]; // Accessing the first model for display
  const bestModelInfo = modelData?.training_metadata?.best_model_info;
  const allModelsPerformance = modelData?.training_metadata?.all_models_performance || [];
  const datasetInfo = yourModelDataJson?.dataset;

  return (
    <>
      <ProjectHeader projectId={project.id} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold">Model Training</h1>
          </div>
          <Button size="sm">
            <PlayIcon className="h-4 w-4 mr-2" />
            Train Model
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Dataset Information</CardTitle>
            <CardDescription>Details about the dataset used for training.</CardDescription>
          </CardHeader>
          <CardContent>
            {datasetInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Target Column Name:</p>
                  <p className="text-base font-semibold text-gray-800">{datasetInfo.targetColumnName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Project ID:</p>
                  <p className="text-base text-gray-800 break-words">{datasetInfo.projectId}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No dataset information available.</p>
            )}
          </CardContent>
        </Card>

        {/* Card for Best Model Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Brain className="h-5 w-5 text-green-600 mr-2" /> Best Performing Model
            </CardTitle>
            <CardDescription>Details of the best model found during training.</CardDescription>
          </CardHeader>
          <CardContent>
            {bestModelInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Model Name:</p>
                    <p className="text-lg font-semibold text-blue-700">{bestModelInfo.model_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Model UUID:</p>
                    <p className="text-base text-gray-800 break-words">{bestModelInfo.model_uuid}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Saved Model Path:</p>
                    <a href={bestModelInfo.saved_model_path} className="text-blue-500 hover:underline text-base break-words">
                      {bestModelInfo.saved_model_path}
                    </a>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-2">Best Hyperparameters:</h4>
                  <ul className="list-disc pl-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(bestModelInfo.best_hyperparameters).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>{" "}
                        <span className="text-gray-800">{String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-2">Test Set Performance:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Accuracy:</p>
                      <p className="text-base text-gray-800 font-semibold">{(bestModelInfo.test_set_performance.accuracy * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Weighted F1 Score:</p>
                      <p className="text-base text-gray-800 font-semibold">{(bestModelInfo.test_set_performance.weighted_f1_score * 100).toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-semibold mb-2 text-gray-700">Full Classification Report:</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Metric</th>
                            <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Precision</th>
                            <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recall</th>
                            <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">F1-Score</th>
                            <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Support</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(bestModelInfo.test_set_performance.full_classification_report).map(([key, value]) => {
                            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                              const typedValue = value as { precision?: number; recall?: number; "f1-score"?: number; support?: number; accuracy?: number };
                              return (
                                <tr key={key} className="border-b last:border-b-0 hover:bg-gray-50">
                                  <td className="py-2 px-4 text-sm font-medium text-gray-900">{key === "accuracy" ? "Accuracy" : key}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700">{typedValue.precision !== undefined ? typedValue.precision.toFixed(4) : '-'}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700">{typedValue.recall !== undefined ? typedValue.recall.toFixed(4) : '-'}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700">{typedValue["f1-score"] !== undefined ? typedValue["f1-score"].toFixed(4) : '-'}</td>
                                  <td className="py-2 px-4 text-sm text-gray-700">{typedValue.support !== undefined ? typedValue.support : (typedValue.accuracy !== undefined ? (typedValue.accuracy * 100).toFixed(2) + '%' : '-')}</td>
                                </tr>
                              );
                            }
                            return null;
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No best model information available.</p>
            )}
          </CardContent>
        </Card>

        {/* Card for All Models Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Brain className="h-5 w-5 text-purple-600 mr-2" /> All Models Performance
            </CardTitle>
            <CardDescription>A comparative overview of all trained models.</CardDescription>
          </CardHeader>
          <CardContent>
            {allModelsPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allModelsPerformance.map((model: ModelPerformance) => (
                  <div key={model.model_name} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                    <h4 className="text-md font-semibold mb-2 text-gray-900">{model.model_name}</h4>
                    <p className="text-sm font-medium text-gray-600">Cross-Validation F1 Score:</p>
                    <p className="text-base text-gray-800 mb-2">{(model.cross_validation_f1_score * 100).toFixed(2)}%</p>

                    <h5 className="text-sm font-medium text-gray-600 mt-3">Test Set Performance:</h5>
                    <ul className="text-sm text-gray-700 list-disc pl-5">
                      <li>Accuracy: {(model.test_set_performance.accuracy * 100).toFixed(2)}%</li>
                      <li>Weighted F1 Score: {(model.test_set_performance.weighted_f1_score * 100).toFixed(2)}%</li>
                    </ul>

                    <h5 className="text-sm font-medium text-gray-600 mt-3">Hyperparameters:</h5>
                    <ul className="text-xs text-gray-700 list-disc pl-5">
                      {Object.entries(model.best_hyperparameters).map(([key, value]) => (
                        <li key={`${model.model_name}-${key}`}>
                          {key}: {String(value)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-gray-500">
                <Brain className="h-10 w-10 mb-3" />
                <p className="text-sm text-center mb-4">No model performance data available yet. Train a model to see results.</p>
                <Button variant="outline" size="sm">
                  Train Model
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}