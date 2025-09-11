import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranslateBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isReadOnly?: boolean;
  showCopyButton?: boolean;
  showSpeakButton?: boolean;
}

export const TranslateBox = ({ 
  value, 
  onChange, 
  placeholder, 
  isReadOnly = false,
  showCopyButton = false,
  showSpeakButton = false 
}: TranslateBoxProps) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    if (value) {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      });
    }
  };

  const handleSpeak = () => {
    if (value && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(value);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative group">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={isReadOnly}
        className="min-h-[200px] resize-none bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 focus:bg-card/80 transition-smooth text-base leading-relaxed"
      />
      
      {(showCopyButton || showSpeakButton) && value && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {showSpeakButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeak}
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background/90"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background/90"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};