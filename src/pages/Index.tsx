import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Sparkles, Languages, FileText, Zap, Shield } from "lucide-react";
import { useTranslate } from "@/hooks/useTranslate";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslateBox } from "@/components/TranslateBox";
import { TranslationHistory, Translation } from "@/components/TranslationHistory";
import { DocumentTranslator } from "@/components/DocumentTranslator";
import Header from "@/components/Header";

const Index = () => {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("pt");
  const [targetLang, setTargetLang] = useState("en");

  const { translateText, isLoading, translations, clearHistory } = useTranslate();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    const result = await translateText(sourceText, sourceLang, targetLang);
    setTranslatedText(result);
  };

  const handleSwapLanguages = () => {
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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-blue-500" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center text-primary-foreground">
            <div className="mb-8">
              <img 
                src="/lovable-uploads/b05c9eb2-7b42-4a8e-be97-9d1ebfb3a5a5.png" 
                alt="Brazil Translations Logo" 
                className="h-20 mx-auto mb-6"
              />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Sua mensagem em
            </h1>
            
            <div className="text-4xl md:text-5xl font-bold mb-8 text-accent">
              QUALQUER IDIOMA
            </div>
            
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-primary-foreground/90">
              Há 20 anos conectando o mundo através de traduções precisas e inovadoras. 
              Na Brazil Translations, tecnologia e expertise se unem para transformar suas necessidades em soluções globais.
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span>IA Avançada</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Languages className="w-5 h-5 text-accent" />
                <span>+100 Idiomas</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <FileText className="w-5 h-5 text-accent" />
                <span>Documentos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Zap className="w-5 h-5 text-accent" />
                <span>Instantâneo</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Shield className="w-5 h-5 text-accent" />
                <span>Seguro</span>
              </div>
            </div>

            <div className="text-sm text-primary-foreground/80 mb-8">
              Somos uma empresa certificada ISO 9001, ISO 17100 e ISO 27001
            </div>
          </div>
        </div>
      </section>

      {/* Translation Interface */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              TRADUÇÃO E INTERPRETAÇÃO DE QUALIDADE
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Traduza textos e documentos com precisão profissional usando nossa tecnologia avançada
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white shadow-sm">
                <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Tradução de Texto
                </TabsTrigger>
                <TabsTrigger value="document" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Tradução de Documentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-6">
                <div className="bg-white rounded-2xl shadow-brand p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <LanguageSelector
                      value={sourceLang}
                      onChange={setSourceLang}
                    />
                    <div className="flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSwapLanguages}
                        className="rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground"
                      >
                        <ArrowLeftRight className="w-5 h-5" />
                      </Button>
                    </div>
                    <LanguageSelector
                      value={targetLang}
                      onChange={setTargetLang}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <TranslateBox
                      value={sourceText}
                      onChange={setSourceText}
                      placeholder="Digite o texto que deseja traduzir..."
                    />
                    <TranslateBox
                      value={translatedText}
                      onChange={() => {}}
                      placeholder="A tradução aparecerá aqui..."
                      isReadOnly={true}
                    />
                  </div>

                  <div className="flex justify-center mb-8">
                    <Button
                      onClick={handleTranslate}
                      disabled={!sourceText.trim() || isLoading}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-3 text-lg font-medium shadow-brand"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Traduzindo...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Languages className="w-5 h-5" />
                          Traduzir Texto
                        </div>
                      )}
                    </Button>
                  </div>

                  {translations.length > 0 && (
                    <TranslationHistory
                      translations={translations}
                      onSelectTranslation={handleSelectTranslation}
                      onClearHistory={clearHistory}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="document">
                <div className="bg-white rounded-2xl shadow-brand p-8">
                  <DocumentTranslator />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            <img 
              src="/lovable-uploads/7f972b2f-537e-4f19-b7ab-6593e849de29.png" 
              alt="Brazil Translations" 
              className="h-12 mx-auto mb-4"
            />
          </div>
          <p className="text-primary-foreground/80 mb-4">
            Tradutor Universal - Powered by Brazil Translations
          </p>
          <p className="text-sm text-primary-foreground/60">
            © 2024 Brazil Translations. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;