import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { BrandLogo } from './BrandLogo';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTranslate } from "@/hooks/useDocumentTranslate";

export const DocumentTranslator = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);
  const [sourceLang, setSourceLang] = useState('pt-br');
  const [targetLang, setTargetLang] = useState('es');
  const { toast } = useToast();
  
  const {
    translateDocument,
    isTranslating,
    currentJob,
    downloadFile,
    resetTranslation,
  } = useDocumentTranslate();

  const handleUploadComplete = useCallback((files: FileList) => {
    setUploadedFiles(files);
  }, []);

  const handleTranslateDocument = async () => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, faça upload de pelo menos um arquivo.",
        variant: "destructive",
      });
      return;
    }

    await translateDocument(uploadedFiles, sourceLang, targetLang);
  };

  const handleDownload = () => {
    if (currentJob?.translatedFileUrl) {
      downloadFile(currentJob.translatedFileUrl, currentJob.translatedFileName);
    }
  };

  const handleReset = () => {
    setUploadedFiles(null);
    resetTranslation();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="p-3 bg-gradient-primary rounded-full">
            <img 
              src="/lovable-uploads/fcc990f6-15a8-4800-9cbc-15bd387871b8.png" 
              alt="Brazil Translations Logo" 
              className="h-8 w-8"
            />
          </div>
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Tradutor de Documentos AI
          </h2>
          <p className="text-muted-foreground mt-2">
            Tradução profissional com inteligência artificial mantendo formatação original
          </p>
          <Badge variant="secondary" className="mt-2">
            Powered by Brazil Translations
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
      {uploadedFiles && uploadedFiles.length > 0 && !currentJob && (
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
                <div className="ml-2 text-xs opacity-80">
                  Isso pode levar alguns minutos
                </div>
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
                onClick={handleDownload}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground"
                disabled={!currentJob.translatedFileUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Documento Traduzido
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="bg-secondary/10 hover:bg-secondary/20 border-primary/20"
              >
                Nova Tradução
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
            ✨ Tradução profissional com validação de integridade • Formatação 100% preservada
            <br />
            📊 {currentJob.files?.reduce((sum, f) => sum + (f.original_elements || 0), 0) || 0} elementos traduzidos
            • ⏱️ {currentJob.files?.reduce((sum, f) => sum + (f.processing_time || 0), 0).toFixed(1) || 0}s
            • 🇧🇷 Brazil Translations
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};