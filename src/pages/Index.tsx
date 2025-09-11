import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, ArrowLeftRight, Languages, Sparkles, FileText, MessageSquare } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslateBox } from "@/components/TranslateBox";
import { TranslationHistory, Translation } from "@/components/TranslationHistory";
import { DocumentTranslator } from "@/components/DocumentTranslator";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { useTranslate } from "@/hooks/useTranslate";
import heroImage from "@/assets/hero-translation.jpg";

const Index = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  
  const { translateText, isLoading, translations, clearHistory } = useTranslate();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    const finalSourceLang = sourceLang === 'auto' ? 'pt' : sourceLang;
    const result = await translateText(sourceText, finalSourceLang, targetLang);
    setTranslatedText(result);
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleSelectTranslation = (translation: Translation) => {
    setSourceText(translation.sourceText);
    setTranslatedText(translation.translatedText);
    setSourceLang(translation.sourceLang);
    setTargetLang(translation.targetLang);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-primary">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-background/10 rounded-full backdrop-blur-sm">
              <Languages className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
            Tradutor Universal
          </h1>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Traduza textos e documentos DOCX mantendo formatação original. Powered by OpenAI GPT-4
          </p>
          <div className="flex items-center justify-center gap-6 text-primary-foreground/70 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>OpenAI GPT-4</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Documentos DOCX</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Texto em tempo real</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Configuration Status */}
        <div className="mb-8">
          <SupabaseStatus />
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Texto
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Text Translation Interface */}
              <div className="lg:col-span-2 space-y-6">
            {/* Language Selectors */}
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <LanguageSelector 
                    value={sourceLang} 
                    onChange={setSourceLang}
                    showAutoDetect={true}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapLanguages}
                    disabled={sourceLang === 'auto'}
                    className="bg-background/50 hover:bg-background/70 transition-smooth"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                  
                  <LanguageSelector 
                    value={targetLang} 
                    onChange={setTargetLang}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Translation Boxes */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Source Text */}
              <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <h3 className="font-semibold">Texto original</h3>
                  </div>
                  <TranslateBox
                    value={sourceText}
                    onChange={setSourceText}
                    placeholder="Digite o texto que deseja traduzir..."
                    showSpeakButton={true}
                  />
                </CardContent>
              </Card>

              {/* Translated Text */}
              <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <h3 className="font-semibold">Tradução</h3>
                  </div>
                  <TranslateBox
                    value={translatedText}
                    onChange={() => {}}
                    placeholder="A tradução aparecerá aqui..."
                    isReadOnly={true}
                    showCopyButton={true}
                    showSpeakButton={true}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Translate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isLoading}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg shadow-glow transition-smooth"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2" />
                    Traduzindo...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Traduzir
                  </>
                )}
              </Button>
                </div>
              </div>

              {/* Translation History */}
              <div className="lg:col-span-1">
                <TranslationHistory
                  translations={translations}
                  onClearHistory={clearHistory}
                  onSelectTranslation={handleSelectTranslation}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="document">
            <div className="max-w-4xl mx-auto">
              <DocumentTranslator />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Languages className="h-5 w-5 text-primary" />
            <span className="font-semibold">Tradutor Universal</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Desenvolvido com React, TypeScript e Tailwind CSS. Pronto para deploy!
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;