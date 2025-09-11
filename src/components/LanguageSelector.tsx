import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = [
  { code: 'auto', name: 'Detectar idioma' },
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'Inglês' },
  { code: 'es', name: 'Espanhol' },
  { code: 'fr', name: 'Francês' },
  { code: 'de', name: 'Alemão' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: 'Japonês' },
  { code: 'ko', name: 'Coreano' },
  { code: 'zh', name: 'Chinês' },
  { code: 'ru', name: 'Russo' },
  { code: 'ar', name: 'Árabe' },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  showAutoDetect?: boolean;
}

export const LanguageSelector = ({ value, onChange, showAutoDetect = false }: LanguageSelectorProps) => {
  const filteredLanguages = showAutoDetect ? languages : languages.filter(lang => lang.code !== 'auto');

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-smooth">
        <SelectValue placeholder="Selecionar idioma" />
      </SelectTrigger>
      <SelectContent className="bg-card/90 backdrop-blur-md border-border/50">
        {filteredLanguages.map((language) => (
          <SelectItem key={language.code} value={language.code} className="hover:bg-accent/50">
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};