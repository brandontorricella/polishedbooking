import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { IntakeForm, IntakeFormSubmission } from '@/hooks/useIntakeForms';

interface Props {
  form: IntakeForm;
  onBack: () => void;
}

export function IntakeSubmissionsViewer({ form, onBack }: Props) {
  const [submissions, setSubmissions] = useState<IntakeFormSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string; email: string }>>({});
  const [selected, setSelected] = useState<IntakeFormSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('intake_form_submissions')
        .select('*')
        .eq('form_id', form.id)
        .order('submitted_at', { ascending: false });

      const subs = (data || []) as IntakeFormSubmission[];
      setSubmissions(subs);

      // Fetch profiles for user names
      const userIds = [...new Set(subs.map(s => s.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);

        const map: Record<string, { display_name: string; email: string }> = {};
        (profileData || []).forEach(p => {
          map[p.user_id] = { display_name: p.display_name || 'Unknown', email: p.email };
        });
        setProfiles(map);
      }
      setLoading(false);
    }
    load();
  }, [form.id]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Forms
      </Button>
      <h2 className="text-xl font-bold">📋 {form.name} — Responses</h2>
      <p className="text-sm text-muted-foreground">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No responses yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <div className="border rounded-xl overflow-hidden divide-y">
            {submissions.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelected(sub)}
                className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${selected?.id === sub.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <p className="font-medium text-sm truncate">{profiles[sub.user_id]?.display_name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleDateString()}</p>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-semibold">{profiles[selected.user_id]?.display_name || 'Unknown'}</h3>
                <p className="text-sm text-muted-foreground">{new Date(selected.submitted_at).toLocaleDateString()}</p>
              </div>
              {form.questions?.map(q => (
                <div key={q.id} className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{q.question_text}</p>
                  <p className="text-sm">
                    {Array.isArray(selected.answers[q.id])
                      ? (selected.answers[q.id] as string[]).join(', ')
                      : (selected.answers[q.id] as string) || <em className="text-muted-foreground">No answer</em>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center bg-muted/30 rounded-xl p-12 text-muted-foreground">
              Select a response to view details
            </div>
          )}
        </div>
      )}
    </div>
  );
}
