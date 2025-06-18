"use client"

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createDataset, specifyTargetColumn, startProfiling } from '@/libb/features/data/dataActions';
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, Edit, Check, ChevronLeft, ChevronRight, FileText, BookOpen, X } from 'lucide-react'; // Added X icon for error
import { setLocalFile, setDeleted } from '@/libb/features/data/datasetSlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type DataRow = Record<string, any>;
type FileType = 'csv' | 'json' | 'excel' | 'unknown';
type ColumnMeta = { description: string; isSelected: boolean };

export interface DataUploaderProps {
  projectId: string;
}

export interface DataUploaderRef {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

enum TaskType {
  CLASSIFICATION = "CLASSIFICATION",
  REGRESSION = "REGRESSION",
  CLUSTERING = "CLUSTERING",
  ANOMALY_DETECTION = "ANOMALY_DETECTION",
  TIME_SERIES_FORECASTING = "TIME_SERIES_FORECASTING"
}

function DataUploader({ projectId }: DataUploaderProps, ref: React.Ref<DataUploaderRef>) {
  const [data, setData] = useState<DataRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMetadata, setColumnMetadata] = useState<Record<string, ColumnMeta>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Default to 10 rows per page for better view
  const [datasetDescription, setDatasetDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [taskType, setTaskType] = useState<TaskType | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const [isDatasetUploaded, setIsDatasetUploaded] = useState(false);

  const dispatch = useAppDispatch();
  const { datasets, deleted, status, hasLocalFile } = useAppSelector((state) => state.data);

  const pageOptions = [5, 10, 20, 50, 100];
  const availableColumns = data.length > 0 ? Object.keys(data[0]) : [];
  const canStartProfiling = taskType && targetColumn && datasets.length > 0;

  const handleSubmit = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await dispatch(
        createDataset({
          name: fileName,
          description: datasetDescription,
          projectId,
          format: fileType.toUpperCase(),
          file,
          start_profiling: false
        })
      ).unwrap();

      console.log('Upload successful:', result);
      dispatch(setLocalFile(true));
      setIsDatasetUploaded(true);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(
        err instanceof Error ? err.message :
          typeof err === 'string' ? err :
            'Failed to upload dataset'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartProfiling = async () => {
    if (!datasets.length || !taskType || !targetColumn) return;

    try {
      // First specify the target column
      await dispatch(specifyTargetColumn({
        datasetId: datasets[0].id,
        taskType,
        targetColumnName: targetColumn
      })).unwrap();

      // Then start profiling
      await dispatch(startProfiling(datasets[0].id)).unwrap();
      alert("Target column specified and profiling started successfully!");
    } catch (error) {
      alert("Failed to specify target column or start profiling");
      console.error("Profiling error:", error);
    }
  };

  const parseCSV = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const newData = results.data as DataRow[];
        setData(newData.filter(row => Object.values(row).some(val => val !== undefined && val !== null && val !== ''))); // Filter out completely empty rows
        if (newData.length > 0) {
          const initialMetadata: Record<string, ColumnMeta> = {};
          Object.keys(newData[0]).forEach(key => {
            initialMetadata[key] = { description: '', isSelected: false };
          });
          setColumnMetadata(initialMetadata);
        }
        setIsLoading(false);
        setCurrentPage(1);
        setFileName(file.name);
        setFile(file);
        dispatch(setLocalFile(true));
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setIsLoading(false);
      },
    });
  }, []);

  const parseJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (Array.isArray(jsonData)) {
          setData(jsonData.filter(row => Object.values(row).some(val => val !== undefined && val !== null && val !== ''))); // Filter out completely empty rows
          if (jsonData.length > 0) {
            const initialMetadata: Record<string, ColumnMeta> = {};
            Object.keys(jsonData[0]).forEach(key => {
              initialMetadata[key] = { description: '', isSelected: false };
            });
            setColumnMetadata(initialMetadata);
          }
        } else {
          setError('JSON file should contain an array of objects');
        }
      } catch (err) {
        setError(`Error parsing JSON: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
        setCurrentPage(1);
        setFileName(file.name);
        setFile(file);
        dispatch(setLocalFile(true));
      }
    };
    reader.readAsText(file);
  }, []);

  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet);
        setData(jsonData.filter(row => Object.values(row).some(val => val !== undefined && val !== null && val !== ''))); // Filter out completely empty rows
        if (jsonData.length > 0) {
          const initialMetadata: Record<string, ColumnMeta> = {};
          Object.keys(jsonData[0]).forEach(key => {
            initialMetadata[key] = { description: '', isSelected: false };
          });
          setColumnMetadata(initialMetadata);
        }
      } catch (err) {
        setError(`Error parsing Excel file: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setFileName(file.name);
        setFile(file);
        dispatch(setLocalFile(true));
        setIsLoading(false);
        setCurrentPage(1);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDeleted(false));
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'csv') { setFileType('csv'); parseCSV(file); }
    else if (fileExtension === 'json') { setFileType('json'); parseJSON(file); }
    else if (['xlsx', 'xls'].includes(fileExtension || '')) { setFileType('excel'); parseExcel(file); }
    else {
      setError('Unsupported file type. Please upload CSV, JSON, or Excel file.');
      setIsLoading(false);
      setFile(null);
    }
  }, [parseCSV, parseJSON, parseExcel, dispatch]); // Added dispatch to deps

  useImperativeHandle(ref, () => ({
    handleFileUpload,
  }));

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  useEffect(() => {
    if (data.length > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    // Reset dataset upload status if file changes or is deleted
    if (!file || deleted) {
        setIsDatasetUploaded(false);
    }
  }, [data.length, currentPage, totalPages, file, deleted]);


  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {(!data.length || deleted) && (
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 mb-8 transition-all hover:border-blue-400">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-700">Upload your data file</h2>
              <p className="text-sm text-gray-500 mt-1">Supports CSV, JSON, and Excel formats</p>
            </div>
            <label className="cursor-pointer">
              <span className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Choose File
              </span>
              <input
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {(isLoading || status === "loading") && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Processing your file...</p>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100 flex items-start">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-1 text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {(data.length > 0 && !deleted) && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                <span className="font-medium text-gray-500">File:</span> {fileName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {data.length} rows × {Object.keys(data[0]).length} columns
              </p>
            </div>
            {!isDatasetUploaded && (
                <Button
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                    {status === 'loading' ? 'Uploading...' : 'Upload Dataset'}
                </Button>
            )}
          </div>

          {/* Dataset Description */}
          <div className="space-y-2 p-4 border rounded-lg bg-white shadow-sm">
            <Label htmlFor="dataset-description" className="text-gray-700 font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" /> Dataset Description
            </Label>
            {isEditingDescription ? (
              <div className="flex gap-2 items-center">
                <input
                  id="dataset-description"
                  type="text"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setDatasetDescription(tempDescription);
                      setIsEditingDescription(false);
                    }
                  }}
                  placeholder="Enter a brief description for your dataset"
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDatasetDescription(tempDescription);
                    setIsEditingDescription(false);
                  }}
                  title="Save Description"
                >
                  <Check className="w-5 h-5 text-green-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 italic flex-grow">
                  {datasetDescription || 'No description yet. Click to add one.'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setTempDescription(datasetDescription);
                    setIsEditingDescription(true);
                  }}
                  title="Edit Description"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            )}
          </div>


          {/* Task Type and Target Column Selection */}
          {isDatasetUploaded && ( // Only show this section if dataset is uploaded
            <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    Model Configuration
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-type-select">Task Type</Label>
                  <Select
                    value={taskType || ""}
                    onValueChange={(value: TaskType) => setTaskType(value)}
                  >
                    <SelectTrigger id="task-type-select">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')} {/* Make task types more readable */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-column-select">Target Column</Label>
                  <Select
                    value={targetColumn || ""}
                    onValueChange={(value: string) => setTargetColumn(value)}
                    disabled={!taskType} // Disable target column selection until task type is chosen
                  >
                    <SelectTrigger id="target-column-select">
                      <SelectValue placeholder="Select target column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleStartProfiling}
                  disabled={!canStartProfiling || status === "loading"}
                  className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {status === "loading" ? 'Starting Profiling...' : 'Start Profiling'}
                </Button>
              </div>
            </div>
          )}

          {/* Data Table View */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Data Preview</h3>
            <div className="overflow-x-auto border rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {availableColumns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRows.length > 0 ? (
                    currentRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {availableColumns.map((column, colIndex) => (
                          <td
                            key={`${rowIndex}-${colIndex}`}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-800"
                          >
                            {/* Handle undefined/null values gracefully */}
                            {row[column] !== undefined && row[column] !== null ? String(row[column]) : <span className="text-gray-400 italic">N/A</span>}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={availableColumns.length} className="px-6 py-4 text-center text-gray-500 italic">
                        No data to display for this page.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Rows per page:</span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1); // Reset to first page when rows per page changes
                    }}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageOptions.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {/* Page numbers (optional, but good for larger datasets) */}
                    {/* You can add dynamic page number buttons here if totalPages is not too large */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) && (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => paginate(page)}
                                className={`h-8 w-8 ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                {page}
                            </Button>
                        )
                    ))}
                    {totalPages > 3 && currentPage + 1 < totalPages && (
                        <span className="text-gray-500 text-sm flex items-center">...</span>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DataUploaderr = forwardRef(DataUploader);
export default DataUploaderr;