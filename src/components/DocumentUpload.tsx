import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onUploadComplete: (files: FileList) => void;
  disabled?: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export const DocumentUpload = ({ onUploadComplete, disabled }: DocumentUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    // Handle rejected files
    if (fileRejections.length > 0) {
      const rejectedReasons = fileRejections.map(rejection => 
        rejection.errors.map((error: any) => {
          if (error.code === 'file-too-large') {
            return `${rejection.file.name}: Arquivo muito grande (máximo 300MB)`;
          }
          if (error.code === 'file-invalid-type') {
            return `${rejection.file.name}: Tipo de arquivo não suportado`;
          }
          return `${rejection.file.name}: ${error.message}`;
        }).join(', ')
      ).join('; ');

      toast({
        title: "Arquivos rejeitados",
        description: rejectedReasons,
        variant: "destructive",
      });
    }

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
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

      // Process uploaded files
      const fileInfos: UploadedFile[] = acceptedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      setUploadedFiles(fileInfos);

      // Create FileList from accepted files
      const fileList = acceptedFiles.reduce((acc, file, index) => {
        Object.defineProperty(acc, index, {
          value: file,
          enumerable: true
        });
        return acc;
      }, Object.create(FileList.prototype, {
        length: { value: acceptedFiles.length }
      }));

      onUploadComplete(fileList);

      toast({
        title: "Upload concluído!",
        description: `${acceptedFiles.length} arquivo(s) carregado(s) com sucesso.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao fazer upload dos arquivos. Tente novamente.",
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 300 * 1024 * 1024, // 300MB
    disabled: disabled || isUploading,
    multiple: true
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (newFiles.length === 0) {
      onUploadComplete(Object.create(FileList.prototype, { length: { value: 0 } }));
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
    onUploadComplete(Object.create(FileList.prototype, { length: { value: 0 } }));
  };

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Documentos
          <Badge variant="secondary" className="ml-auto">
            DOCX • PPTX • XLSX
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-border/50 hover:border-primary/50 hover:bg-accent/50'
            }
            ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <p className="text-lg font-semibold mb-2">
                {isDragActive 
                  ? "Solte os arquivos aqui..." 
                  : "Arraste arquivos ou clique para selecionar"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Suporte para DOCX, PPTX e XLSX • Máximo 300MB por arquivo
              </p>
            </div>
            
            {!isDragActive && !disabled && !isUploading && (
              <Button variant="outline" className="mt-2">
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivos
              </Button>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fazendo upload...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Arquivos Carregados ({uploadedFiles.length})</h4>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Limpar Tudo
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};