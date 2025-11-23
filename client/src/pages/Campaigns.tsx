import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle, Calendar, BarChart3 } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  queryData: any[];
  country: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CampaignStats {
  totalSearches: number;
  lastRun: Date | null;
}

export default function Campaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [runningCampaigns, setRunningCampaigns] = useState<Set<string>>(new Set());

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      const result = await response.json();
      return result.data as Campaign[];
    },
  });

  const rerunMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/campaigns/${campaignId}/rerun`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to rerun campaign");
      return response.json();
    },
    onMutate: (campaignId) => {
      setRunningCampaigns((prev) => new Set(prev).add(campaignId));
    },
    onSuccess: (data, campaignId) => {
      toast({
        title: "Campaign Completed",
        description: `Found ${data.data.stats.placesFound} results in ${data.data.stats.processingTimeSeconds.toFixed(1)} seconds`,
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["searches"] });
      setRunningCampaigns((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    },
    onError: (error: any, campaignId) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rerun campaign",
        variant: "destructive",
      });
      setRunningCampaigns((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    },
  });

  const activeCampaigns = campaigns?.filter((c) => c.queryData && c.queryData.length > 0) || [];
  const emptyCampaigns = campaigns?.filter((c) => !c.queryData || c.queryData.length === 0) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your saved ranking check campaigns
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading campaigns...</p>
          </div>
        ) : activeCampaigns.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload a CSV file and save it as a campaign to get started
              </p>
              <Button asChild>
                <a href="/">Upload CSV File</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      {campaign.description && (
                        <CardDescription className="mt-1">
                          {campaign.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      onClick={() => rerunMutation.mutate(campaign.id)}
                      disabled={runningCampaigns.has(campaign.id)}
                      size="sm"
                      className="ml-4"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {runningCampaigns.has(campaign.id) ? "Running..." : "Re-run"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Keywords: </span>
                      <Badge variant="secondary">{campaign.queryData?.length || 0}</Badge>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Country: </span>
                      <Badge variant="outline">{campaign.country || "gb"}</Badge>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Language: </span>
                      <Badge variant="outline">{campaign.language || "en"}</Badge>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      Created {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
