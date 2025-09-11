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

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || `Erro ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Translation response:', data);

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
      console.error('Translation error details:', error);
      
      let errorMessage = "Falha ao traduzir o documento. Tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Mensagens mais específicas baseadas no erro
        if (error.message.includes('OPENAI_API_KEY')) {
          errorMessage = "Configuração da API OpenAI não encontrada. Verifique as configurações do servidor.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Tempo limite excedido. Tente com um arquivo menor ou novamente mais tarde.";
        } else if (error.message.includes('413')) {
          errorMessage = "Arquivo muito grande. O limite é de 300MB.";
        } else if (error.message.includes('400')) {
          errorMessage = "Formato de arquivo não suportado. Use apenas DOCX, PPTX ou XLSX.";
        }
      }
      
      toast({
        title: "Erro na tradução",
        description: errorMessage,
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