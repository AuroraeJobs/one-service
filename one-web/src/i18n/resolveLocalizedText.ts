interface ResolveLocalizedTextOptions {
  source: string;
  translated: string;
  curatedTranslation?: string;
}

/**
 * Curated copy is authoritative when it exists. Phrase-level translators are
 * compatibility helpers and may otherwise return partially translated text.
 */
export const resolveLocalizedText = ({
  source,
  translated,
  curatedTranslation,
}: ResolveLocalizedTextOptions) => (
  curatedTranslation ?? (translated !== source ? translated : source)
);
