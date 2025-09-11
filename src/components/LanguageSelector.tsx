import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = [
  { code: 'auto', name: 'Detectar idioma' },
  { code: 'af', name: 'Africâner' },
  { code: 'sq', name: 'Albanês' },
  { code: 'de', name: 'Alemão' },
  { code: 'am', name: 'Amárico' },
  { code: 'ar', name: 'Árabe' },
  { code: 'hy', name: 'Armênio' },
  { code: 'az', name: 'Azerbaijano' },
  { code: 'eu', name: 'Basco' },
  { code: 'bn', name: 'Bengalês' },
  { code: 'be', name: 'Bielo-russo' },
  { code: 'my', name: 'Birmanês' },
  { code: 'bs', name: 'Bósnio' },
  { code: 'bg', name: 'Búlgaro' },
  { code: 'ca', name: 'Catalão' },
  { code: 'kk', name: 'Cazaque' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'zh-cn', name: 'Chinês (Simplificado)' },
  { code: 'zh-tw', name: 'Chinês (Tradicional)' },
  { code: 'si', name: 'Cingalês' },
  { code: 'ko', name: 'Coreano' },
  { code: 'co', name: 'Corso' },
  { code: 'ht', name: 'Crioulo Haitiano' },
  { code: 'hr', name: 'Croata' },
  { code: 'ku', name: 'Curdo' },
  { code: 'da', name: 'Dinamarquês' },
  { code: 'sk', name: 'Eslovaco' },
  { code: 'sl', name: 'Esloveno' },
  { code: 'es', name: 'Espanhol' },
  { code: 'es-bo', name: 'Espanhol (Bolívia)' },
  { code: 'es-co', name: 'Espanhol (Colômbia)' },
  { code: 'es-mx', name: 'Espanhol (México)' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estoniano' },
  { code: 'fi', name: 'Finlandês' },
  { code: 'fr', name: 'Francês' },
  { code: 'fy', name: 'Frísio' },
  { code: 'gl', name: 'Galego' },
  { code: 'cy', name: 'Galês' },
  { code: 'ka', name: 'Georgiano' },
  { code: 'el', name: 'Grego' },
  { code: 'gu', name: 'Guzerati' },
  { code: 'ha', name: 'Hauçá' },
  { code: 'haw', name: 'Havaiano' },
  { code: 'he', name: 'Hebraico' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'nl', name: 'Holandês' },
  { code: 'hu', name: 'Húngaro' },
  { code: 'ig', name: 'Igbo' },
  { code: 'yi', name: 'Iídiche' },
  { code: 'id', name: 'Indonésio' },
  { code: 'en', name: 'Inglês' },
  { code: 'ga', name: 'Irlandês' },
  { code: 'is', name: 'Islandês' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: 'Japonês' },
  { code: 'jv', name: 'Javanês' },
  { code: 'km', name: 'Khmer' },
  { code: 'lo', name: 'Laosiano' },
  { code: 'la', name: 'Latim' },
  { code: 'lv', name: 'Letão' },
  { code: 'lt', name: 'Lituano' },
  { code: 'lb', name: 'Luxemburguês' },
  { code: 'mk', name: 'Macedônio' },
  { code: 'ml', name: 'Malaiala' },
  { code: 'ms', name: 'Malaio' },
  { code: 'mg', name: 'Malgaxe' },
  { code: 'mt', name: 'Maltês' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongol' },
  { code: 'ne', name: 'Nepalês' },
  { code: 'no', name: 'Norueguês' },
  { code: 'or', name: 'Oriá' },
  { code: 'pa', name: 'Punjabi (Panjabi)' },
  { code: 'ps', name: 'Pastó' },
  { code: 'fa', name: 'Persa' },
  { code: 'pl', name: 'Polonês' },
  { code: 'pt-br', name: 'Português do Brasil' },
  { code: 'pt-ao', name: 'Português de Angola' },
  { code: 'pt-mz', name: 'Português de Moçambique' },
  { code: 'pt-pt', name: 'Português de Portugal' },
  { code: 'ky', name: 'Quirguiz' },
  { code: 'ro', name: 'Romeno' },
  { code: 'ru', name: 'Russo' },
  { code: 'sm', name: 'Samoano' },
  { code: 'sr', name: 'Sérvio' },
  { code: 'st', name: 'Sesoto' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindi' },
  { code: 'so', name: 'Somali' },
  { code: 'sw', name: 'Suaíli' },
  { code: 'sv', name: 'Sueco' },
  { code: 'su', name: 'Sundanês' },
  { code: 'tg', name: 'Tadjique' },
  { code: 'th', name: 'Tailandês' },
  { code: 'ta', name: 'Tâmil' },
  { code: 'cs', name: 'Tcheco' },
  { code: 'te', name: 'Telugo' },
  { code: 'tr', name: 'Turco' },
  { code: 'uk', name: 'Ucraniano' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbeque' },
  { code: 'vi', name: 'Vietnamita' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'zu', name: 'Zulu' }
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
      <SelectTrigger className="w-[180px] bg-card text-card-foreground border-border hover:bg-accent/50 transition-smooth shadow-sm">
        <SelectValue placeholder="Selecionar idioma" />
      </SelectTrigger>
      <SelectContent className="bg-card text-card-foreground border-border shadow-lg backdrop-blur-md z-50">
        {filteredLanguages.map((language) => (
          <SelectItem key={language.code} value={language.code} className="hover:bg-accent/70 focus:bg-accent/70">
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};