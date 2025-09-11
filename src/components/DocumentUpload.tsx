import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
  disabled?: boolean;
}

export const DocumentUpload = ({ onUploadComplete, disabled }: DocumentUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos .docx",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (300MB limit)
    const maxSize = 300 * 1024 * 1024; // 300MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 300MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`originals/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 10;
          if (next >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return next;
        });
      }, 100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(`originals/${fileName}`);

      setUploadedFile({ name: file.name, size: file.size });
      onUploadComplete(urlData.publicUrl, file.name);

      toast({
        title: "Upload concluído!",
        description: "Arquivo enviado com sucesso.",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: disabled || isUploading
  });

  const clearFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  if (uploadedFile) {
    return (
      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-500">Arquivo carregado</h3>
              <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/20 rounded-full">
                  <Upload className="h-8 w-8 text-primary animate-bounce" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Enviando arquivo...</h3>
                <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  {uploadProgress.toFixed(1)}% concluído
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/20 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Envie seu documento DOCX'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Arraste e solte ou clique para selecionar um arquivo DOCX
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    .docx apenas
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Até 300MB
                  </div>
                </div>
              </div>

              <Button variant="outline" className="mt-4">
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivo
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};