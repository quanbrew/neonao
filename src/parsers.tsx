import { useEffect, useState } from 'react';

const parsers: Promise<typeof import('neonao_parsers')> = import(/* webpackPreload: true */ 'neonao_parsers');

export type MarkdownParser = typeof import('neonao_parsers').markdown;

let markdownParser: MarkdownParser | null = null;

export const useMarkdownParser = (): MarkdownParser | null => {
  const [parser, setParser] = useState<[MarkdownParser | null]>([markdownParser]);
  useEffect(() => {
    parsers.then(parsers => {
      setParser([parsers.markdown]);
      markdownParser = parsers.markdown;
    });
  }, []);
  return parser[0];
};
