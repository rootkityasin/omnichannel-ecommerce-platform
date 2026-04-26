"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function PolicyModal({
  isOpen,
  onClose,
  title,
  content,
}: PolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain popup-scrollbar bg-slate-950 text-slate-200 border border-white/10 shadow-2xl shadow-black ring-1 ring-white/10 p-0 rounded-xl">
        {/* Decorative Top Bar */}
        <div className="sticky top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-crab-red to-transparent z-50 opacity-80" />

        <div className="p-8 md:p-10 relative">
          {/* Background Texture Effect */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply" />

          <DialogHeader className="mb-8 text-center space-y-4 relative z-10">
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-crab-red font-mono font-bold">
                Official Document
              </span>
              <DialogTitle className="text-3xl md:text-4xl font-serif text-white tracking-wide font-medium">
                {title}
              </DialogTitle>
            </div>
            <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </DialogHeader>

          <div
            className="relative z-10 prose prose-invert prose-sm max-w-none 
                        prose-headings:font-serif prose-headings:text-amber-50 prose-headings:font-normal prose-headings:tracking-wide
                        prose-p:text-slate-300 prose-p:leading-loose prose-p:font-light
                        prose-strong:text-amber-200 prose-strong:font-medium
                        prose-li:text-slate-300"
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center relative z-10">
            <div className="flex justify-center items-center gap-2 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-crab-red" />
              <p className="text-[10px] text-gray-500 font-serif italic tracking-widest uppercase">
                Crab & Khai Quality Assurance
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-crab-red" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
