import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIInsight {
  id: string;
  business_id: string;
  week_start: string;
  week_end: string;
  insights_text: string;
  data_snapshot: {
    week: string;
    total_bookings: number;
    completed: number;
    canceled: number;
    completion_rate: number;
    cancellation_rate: number;
    total_revenue: number;
    total_tips: number;
    avg_booking_value: number;
    booking_change_pct: number | null;
    top_services: { name: string; count: number; revenue: number }[];
    new_clients: number;
    returning_clients: number;
  } | null;
  generated_at: string;
}

export function useAIInsights(businessId: string | null) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [latestInsight, setLatestInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchInsights = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('business_id', businessId)
        .order('week_start', { ascending: false })
        .limit(12);

      if (error) throw error;
      const typed = (data || []) as unknown as AIInsight[];
      setInsights(typed);
      setLatestInsight(typed[0] || null);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const generateInsights = useCallback(async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {},
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Generation Failed',
          description: data.error,
          variant: 'destructive',
        });
        setGenerating(false);
        return null;
      }

      const insight = data as AIInsight;
      setLatestInsight(insight);
      setInsights((prev) => [insight, ...prev.filter((i) => i.id !== insight.id)]);
      toast({ title: 'Insights Generated', description: 'Your weekly insights are ready!' });
      setGenerating(false);
      return insight;
    } catch (err: any) {
      console.error('Failed to generate insights:', err);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate insights. Please try again.',
        variant: 'destructive',
      });
      setGenerating(false);
      return null;
    }
  }, [toast]);

  return { insights, latestInsight, loading, generating, generateInsights, fetchInsights };
}
