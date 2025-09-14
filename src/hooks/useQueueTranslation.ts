import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface QueueJobResponse {
  jobId: string;
  position: number;
  estimatedTime: number;
  message: string;
}

interface FileInfo {
  name: string;
  size: number;
}

export const useQueueTranslation = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const submitToQueue = async (
    files: FileList,
    sourceLang: string,
    targetLang: string,
    glossaryFile?: File
  ): Promise<string | null> => {
    if (!files || files.length === 0) {
      toast({
        title: "Arquivos necessários",
        description: "Por favor, selecione pelo menos um arquivo para traduzir.",
        variant: "destructive",
      });
      return null;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Adicionar arquivos
      Array.from(files).forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      // Adicionar glossário se fornecido
      if (glossaryFile) {
        formData.append('glossary', glossaryFile);
      }
      
      // Adicionar idiomas
      formData.append('sourceLang', sourceLang);
      formData.append('targetLang', targetLang);

      const response = await fetch('/api/queue/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao enviar para fila');
      }

      const result: QueueJobResponse = await response.json();
      
      setCurrentJobId(result.jobId);
      
      toast({
        title: "Tradução enviada para fila!",
        description: `ID: ${result.jobId}. Posição: ${result.position}. Tempo estimado: ${formatTime(result.estimatedTime)}.`,
      });

      return result.jobId;
      
    } catch (error) {
      console.error('Erro ao enviar tradução:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido ao enviar tradução.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  const estimateTime = (files: FileInfo[]): number => {
    // Estimativa baseada no tamanho dos arquivos
    // Aproximadamente 1MB = 30 segundos de processamento
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const sizeInMB = totalSize / (1024 * 1024);
    const baseTime = Math.max(30, sizeInMB * 30); // Mínimo 30s, 30s por MB
    
    // Adicionar tempo base por arquivo (complexidade de parsing)
    const fileTime = files.length * 15; // 15s por arquivo
    
    return Math.round(baseTime + fileTime);
  };

  const resetQueue = () => {
    setCurrentJobId(null);
  };

  return {
    submitToQueue,
    isSubmitting,
    currentJobId,
    resetQueue,
    estimateTime,
    formatTime,
  };
};