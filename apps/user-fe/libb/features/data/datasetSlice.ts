// src/lib/features/data/datasetSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createDataset, deleteDataset,startProfiling, specifyTargetColumn, fetchDatasetIdByProjectId, fetchDatasetById, fetchEDAByDatasetId, startFeatureEngineering, fetchFeatureEngineeringResults, startFeatureSelection,fetchFeatureSelectionResults  } from "./dataActions";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: string;
  file: string;
  format: string;
  size: number;
  rows: number | null;
  cols: number | null;
  createdAt: string;
  updatedAt: string;
  taskType?: "CLASSIFICATION" | "REGRESSION" | null;
  edaReport?: string;
  featureEngArtifacts?: string;
  featureSelection?: string;
  targetColumnName?: string | null;
  columnsMetadata?: Array<{
    name: string;
    dataType: string;
    isTarget?: boolean;
  }>;
}

interface DatasetState {
  datasets: Dataset[];
  status: "idle" | "loading" | "succeeded" | "failed";
  featureEngStatus: "idle" | "loading" | "succeeded" | "failed";
  featureSelStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | string[];
  hasLocalFile: boolean;
  deleted: boolean;
}

const initialState: DatasetState = {
  datasets: [],
  status: "idle",
  featureEngStatus: "idle",
  featureSelStatus: "idle",
  error: null,
  hasLocalFile: false,
  deleted: false
};


export interface TargetColumn {
  id: string;
  taskType?: "CLASSIFICATION" | "REGRESSION" | null;
  targetColumnName?: string | null;
}

export interface EDAReport {
  profilingStatus: string;
  profilingError: string;
  EDAFileViz: string | null; // Assuming this is a URL or base64 encoded data
}


const datasetSlice = createSlice({
  name: "dataset",
  initialState,
  reducers: {
    setLocalFile: (state, action: PayloadAction<boolean>) => {
      state.hasLocalFile = action.payload;
    },
    clearLocalFile: (state) => {
      state.hasLocalFile = false;
    },
    //TODO: for mocking integration
    setDeleted: (state, action) => {
      state.deleted = action.payload;
      state.status = "idle"
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDataset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createDataset.fulfilled, (state, action: PayloadAction<Dataset>) => {
        state.status = "succeeded";
        state.datasets.push(action.payload);
      })
      .addCase(createDataset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
      })
      .addCase(deleteDataset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteDataset.fulfilled, (state) => {
        state.status = "succeeded";
        state.datasets = [];
      })
      .addCase(deleteDataset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
        //TODO:CHANGGEE FOR TESTINGONKY
        state.deleted = true

      }) .addCase(startProfiling.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(startProfiling.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(startProfiling.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string | string[];
      })
       .addCase(specifyTargetColumn.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(specifyTargetColumn.fulfilled, (state, action) => {
      state.status = "succeeded";
      const { datasetId, taskType, targetColumnName } = action.payload;
      
      // Find and update just the target columns for this dataset
      const dataset = state.datasets.find(d => d.id === datasetId);
      if (dataset) {
        dataset.taskType = taskType;
        dataset.targetColumnName = targetColumnName;
        
        // Also update the columns metadata if it exists
        if (dataset.columnsMetadata) {
          dataset.columnsMetadata = dataset.columnsMetadata.map(col => ({
            ...col,
            isTarget: col.name === targetColumnName
          }));
        }
      }
    })
    .addCase(specifyTargetColumn.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload as string;
    })



    .addCase(fetchDatasetIdByProjectId.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(fetchDatasetIdByProjectId.fulfilled, (state, action: PayloadAction<string>) => {
      // Store the ID - we'll use it to fetch the full dataset
      if (state.datasets.length > 0) {
        state.datasets[0].id = action.payload;
      } else {
        state.datasets.push({
          id: action.payload,
          name: "",
          description: "",
          projectId: "",
          status: "",
          file: "",
          format: "",
          size: 0,
          rows: null,
          cols: null,
          createdAt: "",
          updatedAt: ""
        });
      }
    })
    
    // Fetch Dataset by ID
    .addCase(fetchDatasetById.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(fetchDatasetById.fulfilled, (state, action: PayloadAction<Dataset>) => {
      state.status = "succeeded";
      if (state.datasets.length > 0) {
        // Replace existing dataset
        state.datasets[0] = action.payload;
      } else {
        // Add new dataset
        state.datasets.push(action.payload);
      }
      state.hasLocalFile = true;
    })

    // Add this to your extraReducers in datasetSlice.ts
.addCase(fetchEDAByDatasetId.pending, (state) => {
  state.status = "loading";
  state.error = null;
})
.addCase(fetchEDAByDatasetId.fulfilled, (state, action: PayloadAction<Dataset>) => {
  state.status = "succeeded";
  // You might want to store the EDA report in your state
  // Here I'm assuming you want to attach it to the dataset
  console.log("fetch eda sucess",action.payload)
  console.log("state for eda",state.datasets )
  // use action.payload.EDAFileViz

  const dataset = state.datasets;
  console.log("dataset in eda", dataset)

  state.datasets[0].edaReport = action.payload.EDAFileViz;
  console.log("what fetch eda sends in state",state.datasets[0].edaReport)
  
})
.addCase(fetchEDAByDatasetId.rejected, (state, action) => {
  state.status = "failed";
  state.error = action.payload as string;
})
 .addCase(startFeatureEngineering.pending, (state) => {
  state.featureEngStatus = "loading";
  state.error = null;
})
.addCase(startFeatureEngineering.fulfilled, (state) => {
  state.featureEngStatus = "succeeded";
})
.addCase(startFeatureEngineering.rejected, (state, action) => {
  state.featureEngStatus = "failed";
  state.error = action.payload as string | string[];
})
.addCase(fetchFeatureEngineeringResults.pending, (state) => {
  state.featureEngStatus = "loading";
  state.error = null;
})
.addCase(fetchFeatureEngineeringResults.fulfilled, (state, action) => {
  state.featureEngStatus = "succeeded";

  const { datasetId, vizUrl } = action.payload;

  // Find the matching dataset
  const ds = state.datasets.find(d => d.id === datasetId);

  if (ds) {
    ds.featureEngArtifacts = vizUrl;        // ✅ safe draft mutation
  } else {
    // If it isn't in the array yet, push a stub so UI still works
    state.datasets.push({
      id: datasetId,
      name: "",
      description: "",
      projectId: "",
      status: "",
      file: "",
      format: "",
      size: 0,
      rows: null,
      cols: null,
      createdAt: "",
      updatedAt: "",
      featureEngArtifacts: vizUrl,
    });
  }
})
.addCase(fetchFeatureEngineeringResults.rejected, (state, action) => {
  state.featureEngStatus = "failed";
  state.error = action.payload as string;
})

.addCase(startFeatureSelection.pending, (state) => {
  state.featureSelStatus = "loading";
  state.error = null;
})
.addCase(startFeatureSelection.fulfilled, (state) => {
  state.featureSelStatus = "succeeded";
})
.addCase(startFeatureSelection.rejected, (state, action) => {
  state.featureSelStatus = "failed";
  state.error = action.payload as string | string[];
})
.addCase(fetchFeatureSelectionResults.pending, (state) => {
  state.featureSelStatus = "loading";
  state.error = null;
})
.addCase(fetchFeatureSelectionResults.fulfilled, (state, action) => {
  state.featureSelStatus = "succeeded";

  const { datasetId, featVizUrl } = action.payload;

  // Find the matching dataset
  const ds = state.datasets.find(d => d.id === datasetId);

  if (ds) {
    ds.featureEngArtifacts = featVizUrl;        // ✅ safe draft mutation
  } else {
    // If it isn't in the array yet, push a stub so UI still works
    state.datasets.push({
      id: datasetId,
      name: "",
      description: "",
      projectId: "",
      status: "",
      file: "",
      format: "",
      size: 0,
      rows: null,
      cols: null,
      createdAt: "",
      updatedAt: "",
      featureSelection: vizUrl,
    });
  }
})
.addCase(fetchFeatureSelectionResults.rejected, (state, action) => {
  state.featureSelStatus = "failed";
  state.error = action.payload as string;

});
 }
})
export default datasetSlice.reducer;
export const { setLocalFile, clearLocalFile,setDeleted } = datasetSlice.actions;