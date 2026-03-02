import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Share2, Copy, Mail, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ArticleShareModal({ article, onClose }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const trackShare = async (method) => {
    setLoading(true);
    try {
      await base44.functions.invoke('trackArticleShare', {
        article_url: article.url,
        article_title: article.title,
        source_name: article.sourceName,
        share_method: method
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
    setLoading(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(article.url);
      setCopied(true);
      await trackShare('copy_link');
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmail = async () => {
    const subject = encodeURIComponent(`Check out: ${article.title}`);
    const body = encodeURIComponent(`${article.title}\n\n${article.url}`);
    await trackShare('email');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleTwitter = async () => {
    const text = encodeURIComponent(`${article.title}\n\n${article.url}`);
    await trackShare('twitter');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
  };

  const handleFacebook = async () => {
    await trackShare('facebook');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.url)}`, '_blank', 'width=600,height=400');
  };

  const handleLinkedIn = async () => {
    await trackShare('linkedin');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(article.url)}`, '_blank', 'width=600,height=400');
  };

  const shareOptions = [
    { label: 'Copy Link', icon: Copy, onClick: handleCopyLink, color: 'bg-blue-600 hover:bg-blue-700', disabled: false },
    { label: 'Email', icon: Mail, onClick: handleEmail, color: 'bg-slate-600 hover:bg-slate-700', disabled: false },
    { label: 'Twitter', onClick: handleTwitter, icon: () => <span className="text-sm font-bold">X</span>, color: 'bg-black hover:bg-gray-900', disabled: false },
    { label: 'Facebook', onClick: handleFacebook, icon: () => <span className="text-sm font-bold">f</span>, color: 'bg-blue-700 hover:bg-blue-800', disabled: false },
    { label: 'LinkedIn', onClick: handleLinkedIn, icon: () => <span className="text-sm font-bold">in</span>, color: 'bg-blue-500 hover:bg-blue-600', disabled: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0e1f38] border border-white/15 rounded-2xl shadow-2xl p-6 w-[380px] max-w-[95vw]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Share Article</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 line-clamp-2">{article.title}</p>

        <div className="space-y-2.5">
          {shareOptions.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              disabled={loading || option.disabled}
              className={`w-full ${option.color} text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              {option.label === 'Copy Link' && copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  {typeof option.icon === 'function' ? <option.icon /> : <option.icon className="w-4 h-4" />}
                  {option.label}
                </>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">Your sharing activity is tracked for analytics</p>
      </motion.div>
    </div>
  );
}