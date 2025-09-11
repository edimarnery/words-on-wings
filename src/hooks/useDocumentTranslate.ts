import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TranslationFile {
  original: string;
  translated: string;
  size: number;
  original_elements?: number;
  translated_elements?: number;
  processing_time?: number;
  warnings?: string[];
}

interface TranslationJob {
  id: string;
  originalFileName: string;
  translatedFileName: string;
  sourceLang: string;
  targetLang: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  translatedFileUrl?: string;
  createdAt: string;
  files?: TranslationFile[];
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'http://ia.encnetwork.com.br:3001/api' 
  : 'http://localhost:8001/api';

export const useDocumentTranslate = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentJob, setCurrentJob] = useState<TranslationJob | null>(null);
  const { toast } = useToast();

  const translateDocument = async (
    files: FileList,
    sourceLang: string,
    targetLang: string,
    glossaryFile?: File
  ): Promise<boolean> => {
    if (!files || files.length === 0) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, selecione pelo menos um arquivo.",
        variant: "destructive",
      });
      return false;
    }

    setIsTranslating(true);

    try {
      const formData = new FormData();
      
      // Adicionar arquivos
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      // Adicionar glossário se fornecido
      if (glossaryFile) {
        formData.append('glossario', glossaryFile);
      }

      // Adicionar parâmetros
      formData.append('idioma_origem', sourceLang);
      formData.append('idioma_destino', targetLang);
      formData.append('perfil', 'normal');

      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const job: TranslationJob = {
          id: data.token,
          originalFileName: Array.from(files).map(f => f.name).join(', '),
          translatedFileName: 'documentos_traduzidos.zip',
          sourceLang,
          targetLang,
          status: 'completed',
          translatedFileUrl: `${API_BASE}/download/${data.token}`,
          createdAt: new Date().toISOString(),
          files: data.files,
        };

        setCurrentJob(job);

        toast({
          title: "Tradução concluída!",
          description: `${data.files_count} arquivo(s) traduzido(s) com sucesso.`,
        });

        return true;
      } else {
        throw new Error(data.message || 'Falha na tradução');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Erro na tradução",
        description: error instanceof Error ? error.message : "Falha ao traduzir o documento. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  const getStatus = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/status/${token}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
    return null;
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTranslation = () => {
    setCurrentJob(null);
  };

  return {
    translateDocument,
    isTranslating,
    currentJob,
    getStatus,
    downloadFile,
    resetTranslation,
  };
};