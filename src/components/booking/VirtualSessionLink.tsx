import { useState } from 'react';
import { Monitor, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VirtualSessionLinkProps {
  meetingLink: string;
  isUpcoming?: boolean;
  isWithin30Min?: boolean;
  compact?: boolean;
}

export const VirtualSessionLink = ({ meetingLink, isUpcoming = true, isWithin30Min = false, compact = false }: VirtualSessionLinkProps) => {
  const [copied, setCopied] = useState(false);

  if (!meetingLink || !isUpcoming) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <a
        href={meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
          isWithin30Min
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
        )}
      >
        <Monitor className="w-3.5 h-3.5" />
        {isWithin30Min ? 'Join Now' : 'Join Meeting'}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-5 my-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">💻</div>
        <div>
          <h4 className="font-semibold">Virtual Session</h4>
          <p className="text-sm text-muted-foreground">Join at your appointment time</p>
        </div>
      </div>

      <a
        href={meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white mb-3 transition-all",
          isWithin30Min ? "bg-destructive animate-pulse" : "bg-blue-500 hover:bg-blue-600"
        )}
      >
        <ExternalLink className="w-4 h-4" />
        {isWithin30Min ? '🔴 Join Now' : 'Join Meeting →'}
      </a>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md truncate flex-1 font-mono">
          {meetingLink}
        </span>
        <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
    </div>
  );
};
