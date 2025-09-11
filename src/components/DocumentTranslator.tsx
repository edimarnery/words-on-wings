import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

interface TranslationJob {
  id: string;
  originalFileName: string;
  translatedFileName: string;
  sourceLang: string;
  targetLang: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  translatedFileUrl?: string;
  createdAt: string;
}

export const DocumentTranslator = () => {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [sourceLang, setSourceLang] = useState('pt');
  const [targetLang, setTargetLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentJob, setCurrentJob] = useState<TranslationJob | null>(null);
  const { toast } = useToast();

  const handleUploadComplete = (url: string, name: string) => {
    setFileUrl(url);
    setFileName(name);
  };

  const handleTranslateDocument = async () => {
    if (!fileUrl || !fileName) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, faça upload de um arquivo primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      toast({
        title: "Configuração necessária",
        description: "Conecte-se ao Supabase para traduzir documentos.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);

    try {
      // Call the edge function to translate the document
      const { data, error } = await supabase.functions.invoke('translate-document', {
        body: {
          fileUrl,
          fileName,
          sourceLang,
          targetLang,
        },
      });

      if (error) throw error;

      if (data.success) {
        const job: TranslationJob = {
          id: data.translationId,
          originalFileName: fileName,
          translatedFileName: data.translatedFileName || `translated_${targetLang}_${fileName}`,
          sourceLang,
          targetLang,
          status: 'completed',
          translatedFileUrl: data.translatedFileUrl,
          createdAt: new Date().toISOString(),
        };

        setCurrentJob(job);

        toast({
          title: "Tradução concluída!",
          description: "Seu documento foi traduzido com sucesso.",
        });
      } else {
        throw new Error(data.error || 'Falha na tradução');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Erro na tradução",
        description: "Falha ao traduzir o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTranslation = () => {
    setFileUrl('');
    setFileName('');
    setCurrentJob(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="p-3 bg-gradient-primary rounded-full">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Tradutor de Documentos AI
          </h2>
          <p className="text-muted-foreground mt-2">
            Tradução profissional com OpenAI mantendo formatação original
          </p>
          <Badge variant="secondary" className="mt-2">
            Powered by GPT-4
          </Badge>
        </div>
      </div>

      {/* Language Selection */}
      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Configuração de Idiomas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-sm font-medium mb-2 block">Idioma de origem</label>
              <LanguageSelector 
                value={sourceLang} 
                onChange={setSourceLang}
              />
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />
            
            <div>
              <label className="text-sm font-medium mb-2 block">Idioma de destino</label>
              <LanguageSelector 
                value={targetLang} 
                onChange={setTargetLang}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <DocumentUpload 
        onUploadComplete={handleUploadComplete}
        disabled={isTranslating}
      />

      {/* Translation Controls */}
      {fileUrl && !currentJob && (
        <div className="flex justify-center">
          <Button
            onClick={handleTranslateDocument}
            disabled={isTranslating}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg shadow-glow transition-smooth"
            size="lg"
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Traduzindo documento...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Traduzir Documento
              </>
            )}
          </Button>
        </div>
      )}

      {/* Translation Result */}
      {currentJob && currentJob.status === 'completed' && (
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card border-green-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-green-500 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tradução Concluída
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <h4 className="font-semibold mb-2">Arquivo Original</h4>
                <p className="text-sm text-muted-foreground">{currentJob.originalFileName}</p>
                <Badge variant="outline" className="mt-2">
                  {currentJob.sourceLang.toUpperCase()}
                </Badge>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg">
                <h4 className="font-semibold mb-2">Arquivo Traduzido</h4>
                <p className="text-sm text-muted-foreground">{currentJob.translatedFileName}</p>
                <Badge variant="outline" className="mt-2">
                  {currentJob.targetLang.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => currentJob.translatedFileUrl && handleDownload(currentJob.translatedFileUrl, currentJob.translatedFileName)}
                className="flex-1"
                disabled={!currentJob.translatedFileUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Documento Traduzido
              </Button>
              
              <Button
                variant="outline"
                onClick={resetTranslation}
              >
                Nova Tradução
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
              ✨ Formatação, fontes e layout preservados • Tradução profissional com IA
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};