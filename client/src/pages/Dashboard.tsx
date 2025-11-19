import { useState, useCallback } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import FileUploadZone from '@/components/FileUploadZone';
import FilePreviewCard from '@/components/FilePreviewCard';
import EnhancedProcessingStatus from '@/components/EnhancedProcessingStatus';
import ResultsSection from '@/components/ResultsSection';
import ResultsPreview from '@/components/ResultsPreview';
import DetailedErrorCard from '@/components/DetailedErrorCard';
import ProcessingHistory from '@/components/ProcessingHistory';
import ConsoleOutput from '@/components/ConsoleOutput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/countries';
import { LANGUAGES } from '@/lib/languages';
import logo from '@assets/images-removebg-preview_1762837081677.png';

type ProcessingState = 'idle' | 'previewing' | 'processing' | 'complete' | 'error';

interface HistoryItem {
  id: string;
  fileName: string;
  processedAt: Date;
  status: 'completed' | 'failed';
  queriesProcessed: number;
  placesFound: number;
}

export default function Dashboard() {
  const [state, setState] = useState<ProcessingState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ queries: 0, places: 0 });
  const [processingStats, setProcessingStats] = useState({
    currentQuery: '',
    totalQueries: 0,
    processedQueries: 0,
    queriesPerSecond: 0,
    estimatedTimeRemaining: 0,
    apiCallsMade: 0,
    currentPage: 1,
  });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [fullResultsData, setFullResultsData] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('gb');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n')
        .filter(row => row.trim())
        .map(row => row.split(','));
      setPreviewData(rows);
      setState('previewing');
    };
    reader.readAsText(file);
  }, []);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setPreviewData([]);
    setState('idle');
    setProgress(0);
    setValidationErrors([]);
    setResultsData([]);
    setFullResultsData([]);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;

    console.log('[UPLOAD] Starting CSV processing...');
    setState('processing');
    setProgress(0);
    setProcessingStats({
      currentQuery: '',
      totalQueries: 0,
      processedQueries: 0,
      queriesPerSecond: 0,
      estimatedTimeRemaining: 0,
      apiCallsMade: 0,
      currentPage: 1,
    });
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('gl', selectedCountry);
      formData.append('hl', selectedLanguage);

      console.log('[UPLOAD] Sending request to /api/process-csv-stream');
      const response = await fetch('/api/process-csv-stream', {
        method: 'POST',
        body: formData,
      });
      console.log('[UPLOAD] Response received, status:', response.status);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            console.log('[SSE Received]:', data.type, data.processedQueries, '/', data.totalQueries);

            if (data.type === 'progress') {
              setProgress(data.progress);
              setProcessingStats({
                currentQuery: data.currentQuery,
                totalQueries: data.totalQueries,
                processedQueries: data.processedQueries,
                queriesPerSecond: data.queriesPerSecond,
                estimatedTimeRemaining: data.estimatedTimeRemaining,
                apiCallsMade: data.apiCallsMade,
                currentPage: data.currentPage,
              });
            } else if (data.type === 'complete') {
              setState('complete');
              setProgress(100);
              setResults({
                queries: data.data.stats.queriesProcessed,
                places: data.data.stats.placesFound,
              });
              
              setFullResultsData(data.data.allPlaces);
              
              const queryMap = new Map<string, any>();
              for (const item of data.data.allPlaces) {
                const queryKey = `${item.query}|${item.brand}|${item.branch}`;
                const isNAEntry = item.title === 'Brand not found' && item.query_result_number === 'N/A';
                
                if (!queryMap.has(queryKey)) {
                  queryMap.set(queryKey, item);
                } else {
                  const existing = queryMap.get(queryKey);
                  const existingIsNA = existing.title === 'Brand not found' && existing.query_result_number === 'N/A';
                  
                  if (item.brand_match) {
                    if (!existing.brand_match || 
                        (item.query_result_number !== 'N/A' && existing.query_result_number !== 'N/A' && 
                         item.query_result_number < existing.query_result_number)) {
                      queryMap.set(queryKey, item);
                    }
                  } else if (isNAEntry && !existing.brand_match) {
                    queryMap.set(queryKey, item);
                  }
                }
              }
              
              setResultsData(Array.from(queryMap.values()).slice(0, 100));
              
              setHistory(prev => [{
                id: Date.now().toString(),
                fileName: selectedFile.name,
                processedAt: new Date(),
                status: 'completed',
                queriesProcessed: data.data.stats.queriesProcessed,
                placesFound: data.data.stats.placesFound,
              }, ...prev.slice(0, 9)]);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('Processing error:', error);
      setState('error');
      setValidationErrors([
        {
          type: 'Processing Error',
          message: error.message || 'Failed to process CSV file',
          suggestion: 'Please check your CSV format and try again',
        },
      ]);
    }
  }, [selectedFile, selectedCountry, selectedLanguage]);

  const handleDownloadCSV = useCallback(() => {
    if (fullResultsData.length === 0) return;
    
    const headers = Object.keys(fullResultsData[0]).join(',');
    const rows = fullResultsData.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `places_output_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fullResultsData]);

  const handleDownloadJSON = useCallback(() => {
    if (fullResultsData.length === 0) return;
    
    const json = JSON.stringify(fullResultsData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `places_output_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fullResultsData]);

  const handleDownloadExcel = useCallback(() => {
    console.log('Downloading Excel...');
  }, []);

  const handleDownloadMatches = useCallback(() => {
    if (fullResultsData.length === 0) return;
    
    const queryMap = new Map<string, any>();
    
    for (const result of fullResultsData) {
      const queryKey = `${result.query}|${result.brand}|${result.branch}`;
      const isNAEntry = result.title === 'Brand not found' && result.query_result_number === 'N/A';
      
      if (!queryMap.has(queryKey)) {
        queryMap.set(queryKey, result);
      } else {
        const existing = queryMap.get(queryKey);
        const existingIsNA = existing.title === 'Brand not found' && existing.query_result_number === 'N/A';
        
        if (result.brand_match) {
          if (!existing.brand_match || 
              (result.query_result_number !== 'N/A' && existing.query_result_number !== 'N/A' && 
               result.query_result_number < existing.query_result_number)) {
            queryMap.set(queryKey, result);
          }
        } else if (isNAEntry && !existing.brand_match) {
          queryMap.set(queryKey, result);
        }
      }
    }
    
    const matches = Array.from(queryMap.values());
    if (matches.length === 0) return;
    
    const columnsToExclude = ['address', 'latitude', 'longitude', 'rating', 'ratingCount', 'category', 'phoneNumber', 'website', 'cid', 'brand', 'branch', 'brand_match', 'position'];
    
    const allHeaders = Object.keys(matches[0]);
    const filteredHeaders = allHeaders.filter(h => !columnsToExclude.includes(h));
    
    const displayHeaders = filteredHeaders.map(h => 
      h === 'query_result_number' ? 'local_ranking' : h
    ).join(',');
    
    const rows = matches.map(row => {
      return filteredHeaders.map(header => {
        const val = row[header];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',');
    });
    const csv = [displayHeaders, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `places_brand_matches_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fullResultsData]);

  const handleHistoryDownload = useCallback((id: string, format: string) => {
    console.log(`Downloading history item ${id} as ${format}...`);
  }, []);

  const handleRetry = useCallback(() => {
    setState('idle');
    setSelectedFile(null);
    setPreviewData([]);
    setValidationErrors([]);
  }, []);

  const handleDownloadSample = useCallback(() => {
    const sampleCSV = `Keywords,Brand,Branch
estate agents in belfast,Property People,Belfast
lawyers in london,Smith & Co,London
dentists in manchester,Bright Smile,Manchester`;
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_queries.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Google Local Rank Checker
            </h2>
          </div>

          <div className="space-y-4">
            {state === 'idle' && (
              <>
                <div className="max-w-md mx-auto space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Select Country
                    </label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.gl} value={country.gl}>
                            {country.country} ({country.gl})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Select Language
                    </label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((language) => (
                          <SelectItem key={language.hl} value={language.hl}>
                            {language.language} ({language.hl})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <FileUploadZone
                  selectedFile={null}
                  onFileSelect={handleFileSelect}
                />
              </>
            )}

            {state === 'previewing' && selectedFile && (
              <FilePreviewCard
                fileName={selectedFile.name}
                fileSize={selectedFile.size}
                previewData={previewData}
                onProcess={handleProcess}
                onRemove={handleRemove}
              />
            )}

            {state === 'processing' && (
              <EnhancedProcessingStatus
                progress={progress}
                stats={processingStats}
              />
            )}

            {state === 'complete' && (
              <div className="space-y-6">
                <ResultsSection
                  queriesProcessed={results.queries}
                  placesFound={results.places}
                  onDownloadCSV={handleDownloadCSV}
                  onDownloadMatches={handleDownloadMatches}
                  onProcessAnother={handleRemove}
                />
                
                {resultsData.length > 0 && (
                  <ResultsPreview
                    data={resultsData}
                    totalRows={fullResultsData.length}
                  />
                )}
              </div>
            )}

            {state === 'error' && (
              <DetailedErrorCard
                title="CSV Validation Failed"
                errors={validationErrors}
                onRetry={handleRetry}
                onDownloadSample={handleDownloadSample}
              />
            )}
          </div>

          {state === 'idle' && (
            <>
              {history.length > 0 && (
                <ProcessingHistory
                  history={history}
                  onDownload={handleHistoryDownload}
                />
              )}
              
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Need a sample CSV file?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  data-testid="button-download-sample"
                >
                  Download Sample CSV
                </Button>
              </div>
            </>
          )}
        </div>

        {state === 'processing' && (
          <div className="mx-auto max-w-4xl px-4 py-6">
            <ConsoleOutput />
          </div>
        )}
      </main>
    </div>
  );
}
