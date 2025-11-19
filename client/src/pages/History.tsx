import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Clock, FileText, TrendingDown, TrendingUp, Minus, ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import DashboardHeader from '@/components/DashboardHeader';

interface Search {
  id: string;
  csvFilename: string;
  country: string;
  language: string;
  totalQueries: number;
  totalResults: number;
  totalBrandMatches: number;
  apiCallsMade: number;
  processingTimeSeconds: string;
  status: string;
  createdAt: string;
}

interface RankingResult {
  id: string;
  query: string;
  brand: string;
  branch: string;
  rankingPosition: number | null;
  title: string | null;
  brandMatch: boolean;
  createdAt: string;
}

interface SearchDetail {
  search: Search;
  results: RankingResult[];
  stats: {
    totalResults: number;
    brandMatches: number;
  };
}

export default function History() {
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<{query: string, brand: string, branch: string} | null>(null);

  const { data: searchesData, isLoading: searchesLoading } = useQuery<{ success: boolean; data: Search[] }>({
    queryKey: ['searches'],
    queryFn: async () => {
      const response = await fetch('/api/searches');
      if (!response.ok) throw new Error('Failed to fetch searches');
      return response.json();
    },
  });

  const { data: searchDetail, isLoading: detailLoading } = useQuery<{ success: boolean; data: SearchDetail }>({
    queryKey: ['search', selectedSearchId],
    queryFn: async () => {
      const response = await fetch(`/api/searches/${selectedSearchId}`);
      if (!response.ok) throw new Error('Failed to fetch search details');
      return response.json();
    },
    enabled: !!selectedSearchId,
  });

  const { data: rankingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['ranking-history', selectedQuery],
    queryFn: async () => {
      if (!selectedQuery) return null;
      const params = new URLSearchParams({
        query: selectedQuery.query,
        brand: selectedQuery.brand,
        branch: selectedQuery.branch,
      });
      const response = await fetch(`/api/ranking-history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch ranking history');
      return response.json();
    },
    enabled: !!selectedQuery,
  });

  const searches = searchesData?.data || [];
  const detail = searchDetail?.data;
  const history = rankingHistory?.data || [];

  const chartData = history.map((item: any) => ({
    date: format(new Date(item.createdAt), 'MMM dd, HH:mm'),
    position: item.rankingPosition || 0,
    change: item.change,
  })).reverse();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (change: number | null) => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Search History</h1>
            <p className="text-muted-foreground">View past searches and ranking trends</p>
          </div>
        </div>

        <Tabs defaultValue="searches" className="space-y-4">
          <TabsList>
            <TabsTrigger value="searches">Recent Searches</TabsTrigger>
            {selectedSearchId && <TabsTrigger value="details">Search Details</TabsTrigger>}
            {selectedQuery && <TabsTrigger value="trends">Ranking Trends</TabsTrigger>}
          </TabsList>

          <TabsContent value="searches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search History</CardTitle>
                <CardDescription>Your recent CSV processing jobs</CardDescription>
              </CardHeader>
              <CardContent>
                {searchesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : searches.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No searches yet. Upload a CSV to get started!</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {searches.map((search) => (
                        <Card
                          key={search.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedSearchId(search.id)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{search.csvFilename}</span>
                                  <Badge className={`ml-2 ${getStatusColor(search.status)}`}>
                                    {search.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(search.createdAt), 'MMM dd, yyyy HH:mm')}
                                  </div>
                                  <div>🌍 {search.country.toUpperCase()}</div>
                                  <div>🗣️ {search.language.toUpperCase()}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-2xl font-bold">{search.totalQueries}</div>
                                  <div className="text-xs text-muted-foreground">Queries</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-green-600">{search.totalBrandMatches}</div>
                                  <div className="text-xs text-muted-foreground">Matches</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold">{search.apiCallsMade}</div>
                                  <div className="text-xs text-muted-foreground">API Calls</div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {selectedSearchId && (
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>
                    {detail && `${detail.search.csvFilename} - ${detail.stats.brandMatches} brand matches found`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {detailLoading ? (
                    <Skeleton className="h-96 w-full" />
                  ) : detail ? (
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Query</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.results.map((result) => (
                            <TableRow key={result.id}>
                              <TableCell className="font-medium">{result.query}</TableCell>
                              <TableCell>{result.brand}</TableCell>
                              <TableCell>{result.branch}</TableCell>
                              <TableCell>
                                {result.rankingPosition ? (
                                  <Badge variant="outline">#{result.rankingPosition}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{result.title || 'N/A'}</TableCell>
                              <TableCell>
                                {result.brandMatch ? (
                                  <Badge className="bg-green-500">Match</Badge>
                                ) : (
                                  <Badge variant="outline">No Match</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedQuery({
                                    query: result.query,
                                    brand: result.brand,
                                    branch: result.branch,
                                  })}
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  View Trends
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {selectedQuery && (
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ranking Trends</CardTitle>
                  <CardDescription>
                    {`${selectedQuery.query} - ${selectedQuery.brand} ${selectedQuery.branch}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <Skeleton className="h-96 w-full" />
                  ) : history.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No historical data yet. Run more searches to see trends!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis reversed domain={[1, 'dataMax + 5']} label={{ value: 'Ranking Position', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="position" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                            dot={{ r: 5 }}
                            name="Ranking Position"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      <div>
                        <h3 className="font-semibold mb-3">Historical Data</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Position</TableHead>
                              <TableHead>Change</TableHead>
                              <TableHead>Title</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {history.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                                <TableCell>
                                  {item.rankingPosition ? (
                                    <Badge variant="outline">#{item.rankingPosition}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTrendIcon(item.change)}
                                    {item.change ? (
                                      <span className={item.change > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {Math.abs(item.change)} {item.change > 0 ? 'up' : 'down'}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-md truncate">{item.title || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
