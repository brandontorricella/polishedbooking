import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Upload, FileText, ArrowRight, CheckCircle2, Mail, Loader2, Send } from 'lucide-react';

interface ImportedClient {
  id: string;
  business_id: string;
  import_batch_id: string | null;
  original_name: string | null;
  original_email: string | null;
  original_phone: string | null;
  original_notes: string | null;
  matched_user_id: string | null;
  import_status: string | null;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
}

interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

interface ColumnMap {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export default function BusinessMigration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; matched: number; skipped: number } | null>(null);
  const [existingClients, setExistingClients] = useState<ImportedClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => setBusinessId(data?.id || null));
  }, [user]);

  const fetchClients = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from('imported_clients')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(500);
    setExistingClients((data || []) as ImportedClient[]);
    setLoadingClients(false);
  }, [businessId]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) { toast({ title: 'CSV must have a header and at least one data row', variant: 'destructive' }); return; }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1, 501).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      });

      setParsed({ headers, rows, totalRows: lines.length - 1 });

      const autoMap: ColumnMap = {};
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (!autoMap.name && (lower.includes('name') || lower.includes('client') || lower.includes('customer'))) autoMap.name = h;
        if (!autoMap.email && lower.includes('email')) autoMap.email = h;
        if (!autoMap.phone && (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell'))) autoMap.phone = h;
        if (!autoMap.notes && (lower.includes('note') || lower.includes('comment'))) autoMap.notes = h;
      });
      setColumnMap(autoMap);
      setStep(2);
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!columnMap.name && !columnMap.email) {
      toast({ title: 'Map at least a Name or Email column', variant: 'destructive' }); return;
    }
    if (!businessId || !parsed) return;
    setImporting(true);

    const clients = parsed.rows
      .filter(row => columnMap.name ? row[columnMap.name!]?.trim() : row[columnMap.email!]?.trim())
      .map(row => ({
        business_id: businessId,
        original_name: columnMap.name ? row[columnMap.name] : '',
        original_email: columnMap.email ? row[columnMap.email]?.toLowerCase().trim() : null,
        original_phone: columnMap.phone ? row[columnMap.phone] : null,
        original_notes: columnMap.notes ? row[columnMap.notes] : null,
        import_batch_id: `import_${Date.now()}`,
        import_status: 'imported',
      }));

    let imported = 0, skipped = 0;
    for (let i = 0; i < clients.length; i += 100) {
      const batch = clients.slice(i, i + 100);
      const { error } = await supabase.from('imported_clients').insert(batch);
      if (error) { skipped += batch.length; } else { imported += batch.length; }
    }

    setImportResult({ imported, matched: 0, skipped });
    setStep(3);
    setImporting(false);
    fetchClients();
    // Mark checklist item complete
    if (imported > 0 && businessId) {
      supabase.from('businesses').update({ checklist_clients_imported: true } as any).eq('id', businessId);
    }
  }

  async function handleSendInvite(clientId: string) {
    setSendingInvite(clientId);
    await supabase.from('imported_clients').update({ import_status: 'invited', invited_at: new Date().toISOString() }).eq('id', clientId);
    toast({ title: 'Invitation marked as sent!' });
    fetchClients();
    setSendingInvite(null);
  }

  async function handleSendAllInvites() {
    const uninvited = existingClients.filter(c => c.import_status === 'imported' && c.original_email);
    if (uninvited.length === 0) return;

    const ids = uninvited.map(c => c.id);
    await supabase.from('imported_clients').update({ import_status: 'invited', invited_at: new Date().toISOString() }).in('id', ids);
    toast({ title: `${uninvited.length} clients marked as invited` });
    fetchClients();
  }

  const joinedCount = existingClients.filter(c => c.import_status === 'matched' || c.matched_user_id).length;
  const invitedCount = existingClients.filter(c => c.import_status === 'invited').length;
  const pendingCount = existingClients.filter(c => c.import_status === 'imported' && !c.matched_user_id).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Upload className="w-6 h-6" /> Import Clients</h1>
            <p className="text-muted-foreground text-sm mt-1">Bring your existing client list from Vagaro, Booksy, or any platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-sm">Export your client list as CSV</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-sm">Upload here and map columns</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-sm">Send clients a booking link</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {[
            { title: '📋 How to export from Vagaro', steps: ['Log in to Vagaro → Reports → Client List', 'Click "Export" at the top right', 'Select CSV format and download', 'Upload that file here'] },
            { title: '📋 How to export from Booksy', steps: ['Log in to Booksy → Clients → All Clients', 'Click "Export" or "Download" button', 'Choose CSV format and save the file', 'Upload that file here'] },
          ].map(inst => (
            <details key={inst.title} className="bg-muted/50 border border-border rounded-lg px-4 py-3">
              <summary className="font-semibold text-sm cursor-pointer">{inst.title}</summary>
              <ol className="mt-3 pl-5 text-sm text-muted-foreground space-y-1 list-decimal">
                {inst.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </details>
          ))}
          <details className="bg-muted/50 border border-border rounded-lg px-4 py-3">
            <summary className="font-semibold text-sm cursor-pointer">📋 Using a different platform?</summary>
            <p className="mt-3 text-sm text-muted-foreground">Any CSV with columns for Name, Email, and/or Phone will work. You'll map the columns in the next step.</p>
          </details>
        </div>

        {step === 1 && (
          <Card>
            <CardContent className="p-0">
              <label
                className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-primary/40 rounded-xl bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors cursor-pointer"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload({ target: { files: [f] } } as any); }}
              >
                <FileText className="w-14 h-14 text-muted-foreground mb-3" />
                <h3 className="text-lg font-bold mb-1">Drop your CSV file here</h3>
                <p className="text-muted-foreground text-sm mb-4">or click to choose a file</p>
                <Button asChild><span>Choose File</span></Button>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                <p className="text-xs text-muted-foreground mt-3">Supports CSV files from Vagaro, Booksy, StyleSeat, or any platform</p>
              </label>
            </CardContent>
          </Card>
        )}

        {step === 2 && parsed && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Map Your Columns</h3>
                  <p className="text-sm text-muted-foreground">{parsed.totalRows.toLocaleString()} clients found in {file?.name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setStep(1); setFile(null); setParsed(null); setColumnMap({}); }}>← Change File</Button>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-sm">Match your columns to Polished fields:</h4>
                {([
                  { field: 'name' as const, label: '👤 Client Name', required: true },
                  { field: 'email' as const, label: '📧 Email Address', required: true },
                  { field: 'phone' as const, label: '📱 Phone Number', required: false },
                  { field: 'notes' as const, label: '📝 Notes', required: false },
                ]).map(({ field, label, required }) => (
                  <div key={field} className="flex items-center gap-4">
                    <Label className="min-w-[160px] text-sm">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
                    <Select value={columnMap[field] || '__skip__'} onValueChange={v => setColumnMap(prev => ({ ...prev, [field]: v === '__skip__' ? undefined : v }))}>
                      <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">— Skip this field —</SelectItem>
                        {parsed.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      {columnMap.name && <TableHead>Name</TableHead>}
                      {columnMap.email && <TableHead>Email</TableHead>}
                      {columnMap.phone && <TableHead>Phone</TableHead>}
                      {columnMap.notes && <TableHead>Notes</TableHead>}
                    </TableRow></TableHeader>
                    <TableBody>
                      {parsed.rows.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {columnMap.name && <TableCell>{row[columnMap.name]}</TableCell>}
                          {columnMap.email && <TableCell>{row[columnMap.email]}</TableCell>}
                          {columnMap.phone && <TableCell>{row[columnMap.phone]}</TableCell>}
                          {columnMap.notes && <TableCell className="max-w-[200px] truncate text-muted-foreground">{row[columnMap.notes]?.substring(0, 60)}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">✅ We'll import {parsed.totalRows.toLocaleString()} clients into your Polished account.</p>
                <Button onClick={handleImport} disabled={importing} size="lg">
                  {importing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Importing...</> : `Import ${parsed.totalRows.toLocaleString()} Clients →`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && importResult && (
          <Card>
            <CardContent className="p-10 text-center space-y-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Import Complete!</h2>
              <div className="flex gap-8 justify-center">
                <div className="text-center">
                  <span className="block text-4xl font-extrabold text-primary">{importResult.imported}</span>
                  <span className="text-sm text-muted-foreground">Imported</span>
                </div>
                <div className="text-center">
                  <span className="block text-4xl font-extrabold text-green-500">{importResult.matched}</span>
                  <span className="text-sm text-muted-foreground">Already on Polished</span>
                </div>
                <div className="text-center">
                  <span className="block text-4xl font-extrabold text-muted-foreground">{importResult.skipped}</span>
                  <span className="text-sm text-muted-foreground">Skipped</span>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => { setStep(1); setFile(null); setParsed(null); setImportResult(null); }} variant="outline">Import Another File</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {existingClients.length > 0 && step === 1 && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Imported Clients ({existingClients.length})</CardTitle>
                  <div className="flex gap-2">
                    {joinedCount > 0 && <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">{joinedCount} joined</Badge>}
                    {invitedCount > 0 && <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{invitedCount} invited</Badge>}
                    {pendingCount > 0 && <Badge variant="outline" className="bg-muted text-muted-foreground">{pendingCount} pending</Badge>}
                  </div>
                </div>
                {pendingCount > 0 && (
                  <Button size="sm" onClick={handleSendAllInvites}><Send className="w-3.5 h-3.5 mr-1" /> Mark All Invited</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {existingClients.slice(0, 50).map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.original_name || '—'}</TableCell>
                      <TableCell>{client.original_email || '—'}</TableCell>
                      <TableCell>{client.original_phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          client.matched_user_id ? "bg-green-500/10 text-green-600" :
                          client.import_status === 'invited' ? "bg-blue-500/10 text-blue-600" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {client.matched_user_id ? '✅ Joined' : client.import_status === 'invited' ? '📧 Invited' : '⏳ Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!client.matched_user_id && client.original_email && client.import_status !== 'invited' && (
                          <Button size="sm" variant="outline" onClick={() => handleSendInvite(client.id)} disabled={sendingInvite === client.id}>
                            {sendingInvite === client.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1" />} Invite
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {existingClients.length > 50 && <p className="text-xs text-muted-foreground text-center mt-3">Showing 50 of {existingClients.length} clients</p>}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
