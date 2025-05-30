// components/ui/dataUploader.tsx

import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, Edit, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
type DataRow = Record<string, any>;
type FileType = 'csv' | 'json' | 'excel' | 'unknown';
type ColumnMeta = { description: string; isSelected: boolean };

export default function DataUploader() {
  const [data, setData] = useState<DataRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<FileType>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMetadata, setColumnMetadata] = useState<Record<string, ColumnMeta>>({});
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const pageOptions = [5, 10, 20, 50, 100];

  const handleSubmit = () => {}

  const parseCSV = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const newData = results.data as DataRow[];
        setData(newData);
        if (newData.length > 0) {
          const initialMetadata: Record<string, ColumnMeta> = {};
          Object.keys(newData[0]).forEach(key => {
            initialMetadata[key] = { description: columnMetadata[key]?.description || '', isSelected: columnMetadata[key]?.isSelected || false };
          });
          setColumnMetadata(initialMetadata);
        }
        setIsLoading(false);
        setCurrentPage(1);
      },
      error: (error) => { setError(`Error parsing CSV: ${error.message}`); setIsLoading(false); },
    });
  }, [columnMetadata]);

  const parseJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (Array.isArray(jsonData)) {
          setData(jsonData);
          if (jsonData.length > 0) {
            const initialMetadata: Record<string, ColumnMeta> = {};
            Object.keys(jsonData[0]).forEach(key => {
              initialMetadata[key] = { description: columnMetadata[key]?.description || '', isSelected: columnMetadata[key]?.isSelected || false };
            });
            setColumnMetadata(initialMetadata);
          }
        } else { setError('JSON file should contain an array of objects'); }
      } catch (err) { setError(`Error parsing JSON: ${err instanceof Error ? err.message : String(err)}`); }
      finally { setIsLoading(false); setCurrentPage(1); }
    };
    reader.readAsText(file);
  }, [columnMetadata]);

  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet);
        setData(jsonData);
        if (jsonData.length > 0) {
          const initialMetadata: Record<string, ColumnMeta> = {};
          Object.keys(jsonData[0]).forEach(key => {
            initialMetadata[key] = { description: columnMetadata[key]?.description || '', isSelected: columnMetadata[key]?.isSelected || false };
          });
          setColumnMetadata(initialMetadata);
        }
      } catch (err) { setError(`Error parsing Excel file: ${err instanceof Error ? err.message : String(err)}`); }
      finally { setIsLoading(false); setCurrentPage(1); }
    };
    reader.readAsArrayBuffer(file);
  }, [columnMetadata]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'csv') { setFileType('csv'); parseCSV(file); }
    else if (fileExtension === 'json') { setFileType('json'); parseJSON(file); }
    else if (['xlsx', 'xls'].includes(fileExtension || '')) { setFileType('excel'); parseExcel(file); }
    else { setError('Unsupported file type. Please upload CSV, JSON, or Excel file.'); setIsLoading(false); }
  }, [parseCSV, parseJSON, parseExcel]);

  const handleColumnClick = useCallback((columnName: string) => {
    setEditingColumn(columnName);
    setTempDescription(columnMetadata[columnName]?.description || '');
  }, [columnMetadata]);

  const saveDescription = useCallback(() => {
    if (!editingColumn) return;
    setColumnMetadata(prev => ({ ...prev, [editingColumn]: { ...prev[editingColumn], description: tempDescription } }));
    setEditingColumn(null);
  }, [editingColumn, tempDescription]);

  const selectColumn = useCallback((columnName: string) => {
    const newMetadata = Object.keys(columnMetadata).reduce((acc, key) => {
      acc[key] = { ...columnMetadata[key], isSelected: key === columnName };
      return acc;
    }, {} as Record<string, ColumnMeta>);
    if (!newMetadata[columnName]) { newMetadata[columnName] = { description: columnMetadata[columnName]?.description || '', isSelected: true }; }
    setColumnMetadata(newMetadata);
  }, [columnMetadata]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  useEffect(() => { if (data.length > 0 && currentPage > totalPages) setCurrentPage(totalPages); }, [data.length, currentPage, totalPages]);

   return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{!data.length? "Data Explorer": "Data Preview"}</h1>
        <p className="text-gray-500">Upload and analyze your structured data files</p>
      </div>

      {/* File Upload Card */}
      {!data.length &&
      (<div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 mb-8 transition-all hover:border-blue-400">
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
            <input type="file" accept=".csv,.json,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>)}

      {isLoading && (
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

      {data.length > 0 && (
        <div className="space-y-6">
          {/* File Info and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                <span className="font-medium text-gray-500">File:</span> {fileName}
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {fileType.toUpperCase()}
                </span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {data.length} rows × {Object.keys(data[0]).length} columns
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Rows per page:</span>
                <select 
                  value={rowsPerPage} 
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {pageOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(data[0]).map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[120px]">{key}</span>
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleColumnClick(key)}
                              className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                              title="Add description"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => selectColumn(key)}
                              className={`p-1 rounded ${columnMetadata[key]?.isSelected ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:bg-gray-100'}`}
                              title="Select this column"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {columnMetadata[key]?.description && (
                          <div className="text-xs text-gray-400 mt-1 truncate max-w-[180px]">
                            {columnMetadata[key].description}
                          </div>
                        )}

                        {editingColumn === key && (
                          <div className="absolute z-10 mt-1 left-0 w-64 bg-white p-3 shadow-lg rounded-md border border-gray-200">
                            <textarea
                              value={tempDescription}
                              onChange={(e) => setTempDescription(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter column description..."
                              rows={3}
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                onClick={() => setEditingColumn(null)}
                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveDescription}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.entries(row).map(([key, value], colIndex) => (
                        <td
                          key={colIndex}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${columnMetadata[key]?.isSelected ? 'font-semibold text-blue-700 bg-blue-50' : 'text-gray-600'}`}
                        >
                          <div className="max-w-[200px] truncate" title={typeof value === 'object' ? JSON.stringify(value) : String(value)}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstRow + 1}</span> to{' '}
                <span className="font-medium">{Math.min(indexOfLastRow, data.length)}</span> of{' '}
                <span className="font-medium">{data.length}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => paginate(totalPages)}
                  className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  {totalPages}
                </button>
              )}
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          {data.length > 0 && (
  <div className="mt-6 flex justify-end">
    <button
      onClick={handleSubmit}
      // disabled={isSubmitting}
      className={`px-6 py-2 rounded-lg font-medium ${
           'bg-green-600 text-white hover:bg-green-700'
      } transition-colors flex items-center space-x-2`}
    >
     
      Submit Data
    </button>
  </div>
)}



          {/* Metadata Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Selected column:{' '}
                  <span className="ml-2 font-semibold text-blue-600">
                    {Object.entries(columnMetadata).find(([_, meta]) => meta.isSelected)?.[0] || 'None selected'}
                  </span>
                </h3>
              </div>
              
              {Object.entries(columnMetadata).filter(([_, meta]) => meta.description).length > 0 && (
                <div className="flex-1 max-w-2xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Column descriptions:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(columnMetadata)
                      .filter(([_, meta]) => meta.description)
                      .map(([colName, meta]) => (
                        <div key={colName} className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-sm font-medium text-blue-600 truncate">{colName}</div>
                          <div className="text-xs text-gray-600 truncate">{meta.description}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
