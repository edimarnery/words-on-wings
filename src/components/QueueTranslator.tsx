import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Clock, Users, Copy } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useToast } from "@/hooks/use-toast";
import { useQueueTranslation } from "@/hooks/useQueueTranslation";

export const QueueTranslator = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);
  const [sourceLang, setSourceLang] = useState('pt-br');
  const [targetLang, setTargetLang] = useState('es');
  const { toast } = useToast();
  
  const {
    submitToQueue,
    isSubmitting,
    currentJobId,
    resetQueue,
    estimateTime,
    formatTime,
  } = useQueueTranslation();

  const handleUploadComplete = useCallback((files: FileList) => {
    setUploadedFiles(files);
  }, []);

  const handleSubmitToQueue = async () => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, faça upload de pelo menos um arquivo.",
        variant: "destructive",
      });
      return;
    }

    const jobId = await submitToQueue(uploadedFiles, sourceLang, targetLang);
    if (jobId) {
      // Resetar form após sucesso
      setUploadedFiles(null);
    }
  };

  const copyJobId = () => {
    if (currentJobId) {
      navigator.clipboard.writeText(currentJobId);
      toast({
        title: "ID copiado!",
        description: "O ID da tradução foi copiado para a área de transferência.",
      });
    }
  };

  const getEstimatedTime = () => {
    if (!uploadedFiles) return 0;
    
    const fileInfos = Array.from(uploadedFiles).map(file => ({
      name: file.name,
      size: file.size,
    }));
    
    return estimateTime(fileInfos);
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
            Sistema de Fila de Tradução
          </h2>
          <p className="text-muted-foreground mt-2">
            Envie múltiplos arquivos para tradução e acompanhe o progresso
          </p>
          <Badge variant="secondary" className="mt-2">
            <Users className="h-3 w-3 mr-1" />
            Processamento em fila • Traduções mais precisas
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
        disabled={isSubmitting}
      />

      {/* File Preview and Estimation */}
      {uploadedFiles && uploadedFiles.length > 0 && (
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Resumo da Tradução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Arquivos ({uploadedFiles.length})</h4>
                <div className="space-y-1 text-sm">
                  {Array.from(uploadedFiles).map((file, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{file.name}</span>
                      <span className="text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Estimativas</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tempo estimado:</span>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(getEstimatedTime())}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Idiomas:</span>
                    <span>{sourceLang.toUpperCase()} → {targetLang.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validade:</span>
                    <span className="text-muted-foreground">48 horas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {uploadedFiles && uploadedFiles.length > 0 && !currentJobId && (
        <div className="flex justify-center">
          <Button
            onClick={handleSubmitToQueue}
            disabled={isSubmitting}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg shadow-glow transition-smooth"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Enviando para fila...
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                Enviar para Fila de Tradução
              </>
            )}
          </Button>
        </div>
      )}

      {/* Success Message with Job ID */}
      {currentJobId && (
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card border-green-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-green-500 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tradução Enviada para Fila
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background/50 rounded-lg">
              <h4 className="font-semibold mb-2">ID da Tradução</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded font-mono text-sm">
                  {currentJobId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyJobId}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Guarde este ID para consultar o status e baixar os arquivos traduzidos.
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Sua tradução foi adicionada à fila de processamento</p>
              <p>⏱️ Você receberá os arquivos traduzidos em até {formatTime(getEstimatedTime())}</p>
              <p>📱 Use a aba "Consultar Status" para acompanhar o progresso</p>
              <p>💾 Os arquivos ficarão disponíveis por 48 horas após a conclusão</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={resetQueue}
                className="flex-1"
              >
                Enviar Nova Tradução
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};