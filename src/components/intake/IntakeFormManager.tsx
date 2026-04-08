import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Edit, Eye, ToggleLeft, ToggleRight, Trash2, ArrowRight } from 'lucide-react';
import { useIntakeForms, type IntakeForm } from '@/hooks/useIntakeForms';
import { IntakeFormBuilder } from './IntakeFormBuilder';
import { IntakeSubmissionsViewer } from './IntakeSubmissionsViewer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function IntakeFormManager() {
  const { forms, loading, fetchForms, toggleFormActive, deleteForm } = useIntakeForms();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<IntakeForm | null>(null);

  if (viewingSubmissions) {
    return (
      <IntakeSubmissionsViewer
        form={viewingSubmissions}
        onBack={() => setViewingSubmissions(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Intake Forms
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Collect important client information before appointments</p>
        </div>
        <Button onClick={() => { setEditingForm(null); setShowBuilder(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Create Form
        </Button>
      </div>

      {/* How it works */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl text-sm flex-wrap">
        <div className="flex items-center gap-2"><span className="text-xl">📋</span><span>Create a form</span></div>
        <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <div className="flex items-center gap-2"><span className="text-xl">📅</span><span>Attach to services</span></div>
        <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <div className="flex items-center gap-2"><span className="text-xl">✅</span><span>Client completes it</span></div>
      </div>

      {/* Forms list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <span className="text-5xl block">📋</span>
          <h3 className="text-lg font-semibold">No intake forms yet</h3>
          <p className="text-sm text-muted-foreground">Create a form to collect health history, allergies, or consent before appointments</p>
          <Button onClick={() => { setEditingForm(null); setShowBuilder(true); }}>Create Your First Form</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form, i) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!form.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{form.name}</h3>
                {form.description && <p className="text-sm text-muted-foreground truncate">{form.description}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{form.questions?.length || 0} questions</Badge>
                  <Badge variant="outline" className="text-xs">
                    {form.require_for_new_clients_only ? 'New clients only' : 'All clients'}
                  </Badge>
                  {!form.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setEditingForm(form); setShowBuilder(true); }}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewingSubmissions(form)}>
                  <Eye className="h-3 w-3 mr-1" /> Responses
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleFormActive(form.id, form.is_active)}>
                  {form.is_active ? <ToggleRight className="h-3 w-3 mr-1" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                  {form.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this form?</AlertDialogTitle>
                      <AlertDialogDescription>Existing submissions will be preserved.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteForm(form.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <IntakeFormBuilder
        form={editingForm}
        open={showBuilder}
        onClose={() => { setShowBuilder(false); setEditingForm(null); }}
        onSaved={() => { setShowBuilder(false); setEditingForm(null); fetchForms(); }}
      />
    </div>
  );
}
