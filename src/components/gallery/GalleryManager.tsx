import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGalleryManagement, type GalleryPost } from '@/hooks/useGallery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Heart, Eye, Image, ArrowRight, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GalleryManagerProps {
  businessId: string;
  services?: { id: string; name: string }[];
  staff?: { id: string; name: string }[];
  galleryLimit?: number;
  tier?: string;
}

export function GalleryManager({ businessId, services = [], staff = [], galleryLimit = Infinity, tier = 'basic' }: GalleryManagerProps) {
  const { posts, loading, createPost, updatePost, deletePost, uploadImage } = useGalleryManagement(businessId);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const canAddMore = posts.length < galleryLimit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Before & After Gallery</h2>
          <p className="text-muted-foreground">
            {posts.length} / {galleryLimit === Infinity ? '∞' : galleryLimit} posts
            {tier === 'basic' && (
              <button onClick={() => navigate('/business/pricing')} className="text-primary text-xs ml-2 hover:underline">
                Upgrade for more
              </button>
            )}
          </p>
        </div>
        <Button
          onClick={() => canAddMore ? setShowUpload(true) : navigate('/business/pricing')}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" /> {canAddMore ? 'Add Post' : 'Limit Reached'}
        </Button>
      </div>

      {!canAddMore && tier !== 'elite' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center text-sm">
          <p className="mb-2">You've reached your photo limit.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/business/pricing')}>
            Upgrade to {tier === 'basic' ? 'Pro' : 'Elite'} for {tier === 'basic' ? '20' : 'unlimited'} photos
          </Button>
        </div>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="font-semibold mb-2">No gallery posts yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Showcase your transformations with before & after photos
            </p>
            <Button onClick={() => setShowUpload(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} className={post.is_published ? '' : 'opacity-50'}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Images */}
                  <div className="flex items-center gap-2 shrink-0">
                    <img src={post.before_image_url} alt="Before" className="w-16 h-16 rounded-lg object-cover" />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <img src={post.after_image_url} alt="After" className="w-16 h-16 rounded-lg object-cover" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title || 'Untitled'}</p>
                    <p className="text-sm text-muted-foreground">{post.service_name || 'No service tagged'}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views_count}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Featured</Label>
                      <Switch
                        checked={post.is_featured}
                        onCheckedChange={(v) => updatePost(post.id, { is_featured: v })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Published</Label>
                      <Switch
                        checked={post.is_published}
                        onCheckedChange={(v) => updatePost(post.id, { is_published: v })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('Delete this post?')) deletePost(post.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadDialog
          businessId={businessId}
          services={services}
          staff={staff}
          onClose={() => setShowUpload(false)}
          onSave={async (data) => {
            const success = await createPost(data);
            if (success) setShowUpload(false);
          }}
          uploadImage={uploadImage}
        />
      )}
    </div>
  );
}

function UploadDialog({
  businessId,
  services,
  staff,
  onClose,
  onSave,
  uploadImage,
}: {
  businessId: string;
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  uploadImage: (file: File, type: 'before' | 'after') => Promise<string | null>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, type: 'before' | 'after') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'before') { setBeforeFile(file); setBeforePreview(reader.result as string); }
      else { setAfterFile(file); setAfterPreview(reader.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!beforeFile || !afterFile) return;
    setUploading(true);

    const [beforeUrl, afterUrl] = await Promise.all([
      uploadImage(beforeFile, 'before'),
      uploadImage(afterFile, 'after'),
    ]);

    if (!beforeUrl || !afterUrl) { setUploading(false); return; }

    await onSave({
      title: title || null,
      description: description || null,
      before_image_url: beforeUrl,
      after_image_url: afterUrl,
      service_id: serviceId || null,
      staff_id: staffId || null,
    });
    setUploading(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Before & After</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image uploads */}
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <Label className="text-sm mb-1 block">Before</Label>
              <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'before')} />
              {beforePreview ? (
                <img src={beforePreview} alt="Before" className="w-full aspect-square object-cover rounded-lg cursor-pointer" onClick={() => beforeRef.current?.click()} />
              ) : (
                <div className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => beforeRef.current?.click()}>
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-center">
              <Label className="text-sm mb-1 block">After</Label>
              <input ref={afterRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'after')} />
              {afterPreview ? (
                <img src={afterPreview} alt="After" className="w-full aspect-square object-cover rounded-lg cursor-pointer" onClick={() => afterRef.current?.click()} />
              ) : (
                <div className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => afterRef.current?.click()}>
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Title (optional)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Blonde Balayage Transformation" />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Service</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Staff</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || !beforeFile || !afterFile}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Add Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
