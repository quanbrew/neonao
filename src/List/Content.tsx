import { useMarkdownParser } from '../parsers';
import React from 'react';

interface Props {
  source: string;
  edit: () => void;
}

export const Content = ({ source, edit }: Props) => {
  const parser = useMarkdownParser();
  if (parser) {
    console.log(parser(source));
  }
  return (
    <div className="Content" onClick={edit}>
      {source}
    </div>
  );
};
