import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAIInsights, type AIInsight } from '@/hooks/useAIInsights';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Bot, RefreshCw, Lock, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightsWidgetProps {
  businessId: string;
}

export function AIInsightsWidget({ businessId }: AIInsightsWidgetProps) {
  const { latestInsight, insights, loading, generating, generateInsights } = useAIInsights(businessId);
  const { hasFeature } = useFeatureAccess();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  const canAccess = hasFeature('ai_weekly_insights');

  if (!canAccess) {
    return (
      <Card className="mb-6 border-primary/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">AI Weekly Insights</h3>
            <p className="text-xs text-muted-foreground">Get plain-English summaries of your performance — upgrade to Pro to unlock.</p>
          </div>
          <Button size="sm" onClick={() => navigate('/pricing')}>
            Upgrade
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-5 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading insights...</span>
        </CardContent>
      </Card>
    );
  }

  const displayInsight = selectedInsight || latestInsight;
  const snapshot = displayInsight?.data_snapshot;

  return (
    <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-br from-[hsl(var(--primary)/0.05)] via-background to-background shadow-lg">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-base">AI Weekly Insights</h3>
              {displayInsight && (
                <p className="text-xs text-muted-foreground">
                  Week of {new Date(displayInsight.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(displayInsight.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={generateInsights}
            disabled={generating}
            className="h-9 w-9"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {displayInsight ? (
          <div className="px-5 pb-5">
            {/* Insight Text */}
            <div className="rounded-xl bg-card border border-border p-4 mb-4">
              {displayInsight.insights_text.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                  return (
                    <div key={i} className="flex gap-2.5 mb-2 items-start">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span className="text-sm text-foreground/85 leading-relaxed">
                        {trimmed.replace(/^[•\-*]\s*/, '')}
                      </span>
                    </div>
                  );
                }
                return <p key={i} className="text-sm text-foreground/90 leading-relaxed mb-3">{trimmed}</p>;
              })}
            </div>

            {/* Quick Stats */}
            {snapshot && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <span className="block text-lg font-extrabold">{snapshot.completed}</span>
                  <span className="block text-[11px] text-muted-foreground">Completed</span>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <span className="block text-lg font-extrabold">${snapshot.total_revenue?.toFixed(0)}</span>
                  <span className="block text-[11px] text-muted-foreground">Revenue</span>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <span className="block text-lg font-extrabold">{snapshot.completion_rate}%</span>
                  <span className="block text-[11px] text-muted-foreground">Completion</span>
                </div>
                {snapshot.booking_change_pct !== null && (
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <span className={cn(
                      "block text-lg font-extrabold",
                      (snapshot.booking_change_pct ?? 0) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {(snapshot.booking_change_pct ?? 0) > 0 ? '+' : ''}{snapshot.booking_change_pct}%
                    </span>
                    <span className="block text-[11px] text-muted-foreground">vs Last Week</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Generated {new Date(displayInsight.generated_at).toLocaleDateString()}
              </span>
              {insights.length > 1 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => { setShowHistory(!showHistory); setSelectedInsight(null); }}
                >
                  {showHistory ? 'Hide history' : 'View past weeks'}
                  {showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
              )}
            </div>

            {/* History */}
            {showHistory && insights.length > 1 && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Previous Weeks</p>
                {insights.slice(1).map((ins) => (
                  <button
                    key={ins.id}
                    onClick={() => setSelectedInsight(ins)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      selectedInsight?.id === ins.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30 hover:border-primary/50"
                    )}
                  >
                    <span className="text-xs font-semibold">
                      {new Date(ins.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(ins.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {ins.data_snapshot && (
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {ins.data_snapshot.completed} bookings · ${ins.data_snapshot.total_revenue?.toFixed(0)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 pb-5 text-center">
            <p className="text-sm text-muted-foreground mb-1">No insights yet for this week.</p>
            <p className="text-xs text-muted-foreground mb-4">
              Insights are generated automatically every Monday. Generate them manually anytime.
            </p>
            <Button onClick={generateInsights} disabled={generating} size="sm">
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Now</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
