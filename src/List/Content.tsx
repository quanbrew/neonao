import { MarkdownParser, useMarkdownParser } from '../parsers';
import { Segment } from 'neonao_parsers';
import React from 'react';

const key = ([start, end]: [number, number]): string => `${start}:${end}"`;

interface Props {
  source: string;
  edit: () => void;
}

const Text = ({ text }: { text: string; range: [number, number] }) => {
  return <span>{text}</span>;
};

interface ContainerTagProps {
  children: React.ReactChildren;
  range: [number, number];
}

const Strong = ({ children, range }: ContainerTagProps) => {
  return <strong key={key(range)}>{children}</strong>;
};

const Paragraph = ({ children, range }: ContainerTagProps) => {
  return <p key={key(range)}>{children}</p>;
};

const containerTag = {
  Paragraph,
  Strong,
};

export const render = (segments: Segment[]): JSX.Element | null => {
  const head = segments.pop();
  if (head === undefined) {
    return null;
  } else if (head.event.kind === 'Start') {
    const { tag } = head.event;
    const { name } = tag;
    if (containerTag.hasOwnProperty(name)) {
      const inner = [];
      while (segments.length !== 0) {
        const nextHead = segments[segments.length - 1];
        if (nextHead.event.kind === 'End' && nextHead.event.tag.name === name) {
          const Renderer = containerTag[name];
          return <Renderer children={inner} range={head.range} />;
        }
        const result = render(segments);
        if (result !== null) {
          inner.push(result);
        }
      }
      throw Error();
    }
  } else if (head.event.kind === 'Text') {
    return <Text text={head.event.text} range={head.range} />;
  }
  return render(segments);
};

const startRender = (parser: MarkdownParser | null, source: string): JSX.Element | null => {
  if (parser === null) {
    return <span>{source}</span>;
  } else {
    const parsed = parser(source);
    return render(parsed.reverse());
  }
};

export const Content = ({ source, edit }: Props) => {
  const parser = useMarkdownParser();
  if (parser) {
    console.log(parser(source));
  }
  return (
    <div className="Content" onClick={edit}>
      {startRender(parser, source)}
    </div>
  );
};
