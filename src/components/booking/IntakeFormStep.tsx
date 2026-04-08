import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { IntakeForm, IntakeFormQuestion } from '@/hooks/useIntakeForms';

interface IntakeFormStepProps {
  form: IntakeForm;
  bookingId: string;
  businessName: string;
  onCompleted: () => void;
  onSkip: () => void;
}

export const IntakeFormStep = ({ form, bookingId, businessName, onCompleted, onSkip }: IntakeFormStepProps) => {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const questions = form.questions || [];

  function setAnswer(questionId: string, value: any) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  }

  function toggleMultiAnswer(questionId: string, option: string) {
    const current = (answers[questionId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    setAnswer(questionId, updated);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    questions.forEach(q => {
      if (q.is_required) {
        const answer = answers[q.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
          errs[q.id] = 'This field is required';
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !user) return;
    setSubmitting(true);

    try {
      // Get the booking to find business_id
      const { data: booking } = await supabase
        .from('bookings')
        .select('business_id')
        .eq('id', bookingId)
        .single();

      if (!booking) throw new Error('Booking not found');

      const { error } = await supabase
        .from('intake_form_submissions')
        .insert({
          form_id: form.id,
          booking_id: bookingId,
          user_id: user.id,
          business_id: booking.business_id,
          answers: answers,
        });

      if (error) throw error;

      toast.success('Intake form submitted');
      onCompleted();
    } catch (err: any) {
      console.error('Failed to submit intake form:', err);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const hasRequiredQuestions = questions.some(q => q.is_required);

  return (
    <motion.div
      key="intake"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">{form.name}</h3>
        <p className="text-sm text-muted-foreground">
          {form.description || 'Please complete this form before your appointment.'}
        </p>
      </div>

      <div className="space-y-5">
        {questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {question.question_text}
              {question.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {/* Short Text */}
            {question.question_type === 'text' && (
              <Input
                value={answers[question.id] || ''}
                onChange={e => setAnswer(question.id, e.target.value)}
                placeholder={question.placeholder || ''}
                className={cn(errors[question.id] && 'border-destructive')}
              />
            )}

            {/* Long Text */}
            {question.question_type === 'textarea' && (
              <Textarea
                value={answers[question.id] || ''}
                onChange={e => setAnswer(question.id, e.target.value)}
                placeholder={question.placeholder || ''}
                rows={4}
                className={cn(errors[question.id] && 'border-destructive')}
              />
            )}

            {/* Yes / No */}
            {question.question_type === 'yes_no' && (
              <div className="flex gap-3">
                {['Yes', 'No'].map(val => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    onClick={() => setAnswer(question.id, val)}
                    className={cn(
                      'flex-1 h-11',
                      answers[question.id] === val && val === 'Yes' && 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                      answers[question.id] === val && val === 'No' && 'border-destructive bg-destructive/10 text-destructive',
                    )}
                  >
                    {val === 'Yes' ? '✅' : '❌'} {val}
                  </Button>
                ))}
              </div>
            )}

            {/* Date */}
            {question.question_type === 'date' && (
              <Input
                type="date"
                value={answers[question.id] || ''}
                onChange={e => setAnswer(question.id, e.target.value)}
                className={cn(errors[question.id] && 'border-destructive')}
              />
            )}

            {/* Single Choice */}
            {question.question_type === 'select' && (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={val => setAnswer(question.id, val)}
                className="space-y-2"
              >
                {(question.options || []).map((option, i) => (
                  <label
                    key={i}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      answers[question.id] === option
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value={option} />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </RadioGroup>
            )}

            {/* Multiple Choice */}
            {question.question_type === 'multiselect' && (
              <div className="space-y-2">
                {(question.options || []).map((option, i) => {
                  const selected = ((answers[question.id] as string[]) || []).includes(option);
                  return (
                    <label
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleMultiAnswer(question.id, option)}
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {errors[question.id] && (
              <p className="text-xs text-destructive">{errors[question.id]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gradient-primary"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            'Submit & Complete Booking'
          )}
        </Button>

        {!hasRequiredQuestions && (
          <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
            Skip for now
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        Your information is private and only visible to {businessName}.
      </p>
    </motion.div>
  );
};
