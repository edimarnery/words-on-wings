import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Clock, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QueueJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  position?: number;
  estimatedTime?: number;
  originalFiles: string[];
  translatedFiles?: string[];
  sourceLang: string;
  targetLang: string;
  createdAt: number;
  expiresAt: number;
  downloadUrl?: string;
  error?: string;
}

export const QueueStatusChecker = () => {
  const [jobId, setJobId] = useState('');
  const [jobInfo, setJobInfo] = useState<QueueJob | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkStatus = async () => {
    if (!jobId.trim()) {
      toast({
        title: "ID necessário",
        description: "Por favor, insira o ID da tradução.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/queue/status/${jobId.trim()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "ID não encontrado",
            description: "Verifique se o ID está correto ou se a tradução não expirou.",
            variant: "destructive",
          });
        } else {
          throw new Error('Erro ao consultar status');
        }
        return;
      }

      const data = await response.json();
      setJobInfo(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao consultar o status da tradução.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (jobInfo?.downloadUrl) {
      const a = document.createElement('a');
      a.href = jobInfo.downloadUrl;
      a.download = `traducao_${jobInfo.id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Na fila';
      case 'processing': return 'Processando';
      case 'completed': return 'Concluído';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consultar Status da Tradução
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o ID da tradução..."
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkStatus()}
            />
            <Button
              onClick={checkStatus}
              disabled={loading}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              {loading ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Use o ID fornecido após enviar sua tradução para acompanhar o progresso.
          </div>
        </CardContent>
      </Card>

      {jobInfo && (
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(jobInfo.status)}
                Status da Tradução
              </div>
              <Badge variant={jobInfo.status === 'completed' ? 'default' : 'secondary'}>
                {getStatusText(jobInfo.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Informações da Tradução</h4>
                <div className="text-sm space-y-1">
                  <div>ID: <code className="bg-muted px-1 rounded">{jobInfo.id}</code></div>
                  <div>Idioma: {jobInfo.sourceLang} → {jobInfo.targetLang}</div>
                  <div>Arquivos: {jobInfo.originalFiles.length}</div>
                  <div>Criado: {new Date(jobInfo.createdAt * 1000).toLocaleString('pt-BR')}</div>
                  <div>Expira: {new Date(jobInfo.expiresAt * 1000).toLocaleString('pt-BR')}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Status Atual</h4>
                <div className="text-sm space-y-1">
                  {jobInfo.status === 'pending' && jobInfo.position && (
                    <div>Posição na fila: {jobInfo.position}</div>
                  )}
                  {jobInfo.estimatedTime && jobInfo.status !== 'completed' && (
                    <div>Tempo estimado: {formatTime(jobInfo.estimatedTime)}</div>
                  )}
                  {jobInfo.status === 'error' && jobInfo.error && (
                    <div className="text-red-500">Erro: {jobInfo.error}</div>
                  )}
                </div>
              </div>
            </div>

            {jobInfo.originalFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Arquivos</h4>
                <div className="grid gap-2">
                  {jobInfo.originalFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file}</span>
                      </div>
                      {jobInfo.status === 'completed' && jobInfo.translatedFiles?.[index] && (
                        <Badge variant="outline" className="text-green-600">
                          Traduzido
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {jobInfo.status === 'completed' && jobInfo.downloadUrl && (
              <div className="flex justify-center pt-4 border-t border-border/20">
                <Button
                  onClick={downloadFile}
                  className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Arquivos Traduzidos
                </Button>
              </div>
            )}
            
            {jobInfo.status === 'processing' && (
              <div className="text-center text-sm text-muted-foreground border-t border-border/20 pt-4">
                Sua tradução está sendo processada... Você pode fechar esta página e voltar depois.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};