import { HelpCircle, History, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { Link, useLocation } from 'wouter';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import logo from '@assets/images-removebg-preview_1762837081677.png';

export default function DashboardHeader() {
  const [location] = useLocation();
  const isHistoryPage = location === '/history';
  const isCampaignsPage = location === '/campaigns';
  const isDashboard = location === '/';

  return (
    <header className="h-16 border-b border-border bg-background sticky top-0 z-50">
      <div className="h-full max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/">
          <img src={logo} alt="Nurture Logo" className="h-8 cursor-pointer" />
        </Link>
        <div className="flex items-center gap-2">
          {!isCampaignsPage && (
            <Link href="/campaigns">
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Campaigns
              </Button>
            </Link>
          )}
          {!isHistoryPage && (
            <Link href="/history">
              <Button variant="ghost" size="sm">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
          )}
          <ThemeToggle />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-help">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">How to use</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Upload a CSV file with Keywords, Brand, and Branch columns</li>
                  <li>The system will search Google Places for each keyword</li>
                  <li>Brand matching will identify relevant results</li>
                  <li>Download the complete results in CSV or JSON format</li>
                </ol>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
