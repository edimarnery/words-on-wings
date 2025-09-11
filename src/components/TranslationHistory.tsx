import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";

export interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
}

interface TranslationHistoryProps {
  translations: Translation[];
  onClearHistory: () => void;
  onSelectTranslation: (translation: Translation) => void;
}

export const TranslationHistory = ({ 
  translations, 
  onClearHistory, 
  onSelectTranslation 
}: TranslationHistoryProps) => {
  if (translations.length === 0) {
    return (
      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhuma tradução realizada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Histórico ({translations.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-destructive hover:text-destructive/80"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {translations.slice(0, 10).map((translation) => (
          <div
            key={translation.id}
            onClick={() => onSelectTranslation(translation)}
            className="p-3 rounded-lg bg-background/50 hover:bg-background/70 cursor-pointer transition-smooth border border-border/30"
          >
            <div className="text-sm text-muted-foreground mb-1">
              {translation.sourceLang.toUpperCase()} → {translation.targetLang.toUpperCase()}
            </div>
            <div className="text-sm font-medium mb-1 line-clamp-2">
              {translation.sourceText}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {translation.translatedText}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {translation.timestamp.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};