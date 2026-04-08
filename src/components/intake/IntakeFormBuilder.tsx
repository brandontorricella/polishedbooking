import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccountType } from '@/hooks/useAccountType';
import { toast } from 'sonner';
import type { IntakeForm, IntakeFormQuestion } from '@/hooks/useIntakeForms';

interface FormBuilderProps {
  form?: IntakeForm | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface QuestionDraft {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
  placeholder: string;
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'select', label: 'Single Choice' },
  { value: 'multiselect', label: 'Multiple Choice' },
  { value: 'date', label: 'Date' },
];

export function IntakeFormBuilder({ form: existingForm, open, onClose, onSaved }: FormBuilderProps) {
  const { businessId } = useAccountType();
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    require_for_new_clients_only: false,
    service_ids: [] as string[],
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    if (existingForm) {
      setFormData({
        name: existingForm.name,
        description: existingForm.description || '',
        require_for_new_clients_only: existingForm.require_for_new_clients_only,
        service_ids: existingForm.service_ids || [],
      });
      setQuestions(
        (existingForm.questions || []).map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          is_required: q.is_required,
          sort_order: q.sort_order,
          placeholder: q.placeholder || '',
        }))
      );
    } else {
      setFormData({ name: '', description: '', require_for_new_clients_only: false, service_ids: [] });
      setQuestions([]);
    }
    setActiveTab('settings');
  }, [existingForm, open]);

  useEffect(() => {
    if (!businessId) return;
    supabase
      .from('services')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .then(({ data }) => setServices(data || []));
  }, [businessId]);

  function addQuestion() {
    setQuestions([...questions, {
      id: `new_${Date.now()}`,
      question_text: '',
      question_type: 'text',
      options: [],
      is_required: false,
      sort_order: questions.length,
      placeholder: '',
    }]);
  }

  function updateQuestion(index: number, field: string, value: any) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setQuestions(updated);
  }

  function addOption(qi: number) {
    const updated = [...questions];
    updated[qi].options = [...(updated[qi].options || []), ''];
    setQuestions(updated);
  }

  function updateOption(qi: number, oi: number, value: string) {
    const updated = [...questions];
    updated[qi].options[oi] = value;
    setQuestions(updated);
  }

  function removeOption(qi: number, oi: number) {
    const updated = [...questions];
    updated[qi].options = updated[qi].options.filter((_, i) => i !== oi);
    setQuestions(updated);
  }

  async function handleSave() {
    if (!formData.name.trim()) { toast.error('Form name is required'); return; }
    if (questions.length === 0) { toast.error('Add at least one question'); return; }
    if (questions.some(q => !q.question_text.trim())) { toast.error('All questions must have text'); return; }
    if (!businessId) return;
    setSaving(true);

    try {
      if (existingForm) {
        const { error } = await supabase
          .from('intake_forms')
          .update({
            name: formData.name,
            description: formData.description || null,
            require_for_new_clients_only: formData.require_for_new_clients_only,
            service_ids: formData.service_ids,
          })
          .eq('id', existingForm.id);

        if (error) throw error;

        await supabase.from('intake_form_questions').delete().eq('form_id', existingForm.id);
        await supabase.from('intake_form_questions').insert(
          questions.map((q, i) => ({
            form_id: existingForm.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options || [],
            is_required: q.is_required,
            sort_order: i,
            placeholder: q.placeholder || null,
          }))
        );
        toast.success('Form updated');
      } else {
        const { data: form, error } = await supabase
          .from('intake_forms')
          .insert({
            business_id: businessId,
            name: formData.name,
            description: formData.description || null,
            require_for_new_clients_only: formData.require_for_new_clients_only,
            service_ids: formData.service_ids,
          })
          .select()
          .single();

        if (error || !form) throw error;

        if (questions.length > 0) {
          await supabase.from('intake_form_questions').insert(
            questions.map((q, i) => ({
              form_id: form.id,
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options || [],
              is_required: q.is_required,
              sort_order: i,
              placeholder: q.placeholder || null,
            }))
          );
        }
        toast.success('Form created');
      }
      onSaved();
    } catch (err) {
      toast.error('Failed to save form');
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingForm ? 'Edit Form' : '📋 Create Intake Form'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            <TabsTrigger value="questions" className="flex-1">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Form Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Health History Form" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Explain to clients why you're collecting this..." rows={2} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">New Clients Only</p>
                <p className="text-xs text-muted-foreground">Only show to first-time clients</p>
              </div>
              <Switch checked={formData.require_for_new_clients_only} onCheckedChange={(v) => setFormData({ ...formData, require_for_new_clients_only: v })} />
            </div>
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Apply to Specific Services</Label>
                <p className="text-xs text-muted-foreground">Leave all unchecked to apply to all bookings</p>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((s) => (
                    <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm ${formData.service_ids.includes(s.id) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <Checkbox checked={formData.service_ids.includes(s.id)} onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          service_ids: checked ? [...formData.service_ids, s.id] : formData.service_ids.filter((id) => id !== s.id),
                        });
                      }} />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-4">
            {questions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No questions yet. Add your first question below.</p>
            )}
            {questions.map((q, index) => (
              <div key={q.id} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Q{index + 1}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => moveQuestion(index, 'up')} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeQuestion(index)}><X className="h-3 w-3" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Question Text *</Label>
                    <Input value={q.question_text} onChange={(e) => updateQuestion(index, 'question_text', e.target.value)} placeholder="e.g. Do you have any allergies?" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={q.question_type} onValueChange={(v) => updateQuestion(index, 'question_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(q.question_type === 'select' || q.question_type === 'multiselect') && (
                  <div className="space-y-2">
                    <Label className="text-xs">Answer Options</Label>
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} className="flex gap-2">
                        <Input value={opt} onChange={(e) => updateOption(index, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1" />
                        <Button variant="outline" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeOption(index, oi)}><X className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed text-primary" onClick={() => addOption(index)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Option
                    </Button>
                  </div>
                )}

                {(q.question_type === 'text' || q.question_type === 'textarea') && (
                  <div className="space-y-1">
                    <Label className="text-xs">Placeholder (optional)</Label>
                    <Input value={q.placeholder} onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)} placeholder="e.g. Please list any allergies..." />
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={q.is_required} onCheckedChange={(v) => updateQuestion(index, 'is_required', !!v)} />
                  <span>Required field</span>
                </label>
              </div>
            ))}

            <Button variant="outline" className="w-full border-dashed border-2 border-primary/40 text-primary hover:bg-primary/5" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              <h3 className="font-semibold text-lg">{formData.name || 'Untitled Form'}</h3>
              {formData.description && <p className="text-sm text-muted-foreground">{formData.description}</p>}
              {questions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No questions added yet</p>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-sm font-medium">
                      {q.question_text}
                      {q.is_required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    {q.question_type === 'text' && <Input placeholder={q.placeholder} disabled />}
                    {q.question_type === 'textarea' && <Textarea placeholder={q.placeholder} rows={3} disabled />}
                    {q.question_type === 'yes_no' && (
                      <div className="flex gap-2">
                        <Button variant="outline" disabled className="flex-1">Yes</Button>
                        <Button variant="outline" disabled className="flex-1">No</Button>
                      </div>
                    )}
                    {q.question_type === 'date' && <Input type="date" disabled />}
                    {(q.question_type === 'select' || q.question_type === 'multiselect') && (
                      <div className="space-y-1">
                        {(q.options || []).map((opt, oi) => (
                          <label key={oi} className="flex items-center gap-2 text-sm p-2 border rounded-lg">
                            <input type={q.question_type === 'select' ? 'radio' : 'checkbox'} disabled />
                            <span>{opt || `Option ${oi + 1}`}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : existingForm ? 'Save Changes' : 'Create Form'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
