import { useState } from 'react';
import { Translation } from '@/components/TranslationHistory';
import { useToast } from '@/hooks/use-toast';

export const useTranslate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const { toast } = useToast();

  const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    if (!text.trim()) return '';

    setIsLoading(true);
    
    try {
      // Using MyMemory Translation API (free tier)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        const translatedText = data.responseData.translatedText;
        
        // Add to history
        const newTranslation: Translation = {
          id: Date.now().toString(),
          sourceText: text,
          translatedText,
          sourceLang,
          targetLang,
          timestamp: new Date(),
        };
        
        setTranslations(prev => [newTranslation, ...prev]);
        
        return translatedText;
      } else {
        throw new Error('Falha na tradução');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Erro na tradução",
        description: "Não foi possível traduzir o texto. Tente novamente.",
        variant: "destructive",
      });
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setTranslations([]);
    toast({
      title: "Histórico limpo",
      description: "O histórico de traduções foi removido.",
    });
  };

  return {
    translateText,
    isLoading,
    translations,
    clearHistory,
  };
};