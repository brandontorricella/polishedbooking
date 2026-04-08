import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccountType } from '@/hooks/useAccountType';
import { toast } from 'sonner';

export interface IntakeFormQuestion {
  id: string;
  form_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
  placeholder: string | null;
}

export interface IntakeForm {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  require_for_new_clients_only: boolean;
  service_ids: string[];
  created_at: string;
  updated_at: string;
  questions?: IntakeFormQuestion[];
}

export interface IntakeFormSubmission {
  id: string;
  form_id: string;
  booking_id: string | null;
  user_id: string;
  business_id: string;
  answers: Record<string, any>;
  submitted_at: string;
}

export function useIntakeForms() {
  const { businessId } = useAccountType();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchForms() {
    if (!businessId) return;
    setLoading(true);
    const { data: formsData, error } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching intake forms:', error);
      setLoading(false);
      return;
    }

    // Fetch questions for each form
    const formsWithQuestions: IntakeForm[] = [];
    for (const form of formsData || []) {
      const { data: questions } = await supabase
        .from('intake_form_questions')
        .select('*')
        .eq('form_id', form.id)
        .order('sort_order', { ascending: true });

      formsWithQuestions.push({
        ...form,
        service_ids: (form as any).service_ids || [],
        questions: (questions || []) as IntakeFormQuestion[],
      });
    }

    setForms(formsWithQuestions);
    setLoading(false);
  }

  async function createForm(
    formData: { name: string; description: string; require_for_new_clients_only: boolean; service_ids: string[] },
    questions: Omit<IntakeFormQuestion, 'id' | 'form_id'>[]
  ) {
    if (!businessId) return;

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

    if (error || !form) {
      toast.error('Failed to create form');
      return;
    }

    if (questions.length > 0) {
      const { error: qError } = await supabase.from('intake_form_questions').insert(
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
      if (qError) console.error('Error creating questions:', qError);
    }

    toast.success('Form created');
    fetchForms();
  }

  async function updateForm(
    formId: string,
    formData: { name: string; description: string; require_for_new_clients_only: boolean; service_ids: string[] },
    questions: Omit<IntakeFormQuestion, 'form_id'>[]
  ) {
    const { error } = await supabase
      .from('intake_forms')
      .update({
        name: formData.name,
        description: formData.description || null,
        require_for_new_clients_only: formData.require_for_new_clients_only,
        service_ids: formData.service_ids,
      })
      .eq('id', formId);

    if (error) {
      toast.error('Failed to update form');
      return;
    }

    // Delete existing questions and recreate
    await supabase.from('intake_form_questions').delete().eq('form_id', formId);

    if (questions.length > 0) {
      await supabase.from('intake_form_questions').insert(
        questions.map((q, i) => ({
          form_id: formId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          is_required: q.is_required,
          sort_order: i,
          placeholder: q.placeholder || null,
        }))
      );
    }

    toast.success('Form updated');
    fetchForms();
  }

  async function toggleFormActive(formId: string, currentActive: boolean) {
    const { error } = await supabase
      .from('intake_forms')
      .update({ is_active: !currentActive })
      .eq('id', formId);

    if (error) {
      toast.error('Failed to update form');
      return;
    }
    toast.success(`Form ${currentActive ? 'deactivated' : 'activated'}`);
    fetchForms();
  }

  async function deleteForm(formId: string) {
    const { error } = await supabase.from('intake_forms').delete().eq('id', formId);
    if (error) {
      toast.error('Failed to delete form');
      return;
    }
    toast.success('Form deleted');
    fetchForms();
  }

  async function fetchSubmissions(formId: string) {
    const { data, error } = await supabase
      .from('intake_form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
    return data || [];
  }

  useEffect(() => {
    fetchForms();
  }, [businessId]);

  return { forms, loading, fetchForms, createForm, updateForm, toggleFormActive, deleteForm, fetchSubmissions };
}
