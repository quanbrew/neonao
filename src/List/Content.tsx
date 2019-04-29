import { MarkdownParser, useMarkdownParser } from '../parsers';
import { Segment, Tag } from 'neonao_parsers';
import React from 'react';

const key = ([start, end]: [number, number]): string => `${start}:${end}"`;

interface Props {
  source: string;
  edit: () => void;
}

const Text = ({ text, range }: { text: string; range: [number, number] }) => {
  return <span key={key(range)}>{text}</span>;
};

interface ContainerTagProps {
  children: React.ReactChildren;
  range: [number, number];
  tag: Tag;
}

const Strong = ({ children }: ContainerTagProps) => {
  return <strong>{children}</strong>;
};

const Emphasis = ({ children }: ContainerTagProps) => {
  return <em>{children}</em>;
};

const Default = ({ children }: ContainerTagProps) => {
  return <del>{children}</del>;
};

const Code = ({ children }: ContainerTagProps) => {
  return <code>{children}</code>;
};

const Link = ({ children, tag }: ContainerTagProps) => {
  if (tag.name !== 'Link') {
    throw Error();
  } else {
    return (
      <a href={tag.url} title={tag.title}>
        {children}
      </a>
    );
  }
};

const Unsupported = ({  }: { range: [number, number] }) => {
  return <del>[UNSUPPORTED]</del>;
};
const Paragraph = ({ children }: ContainerTagProps) => {
  return <p>{children}</p>;
};

const containerTag = {
  Paragraph,
  Strong,
  Code,
  Link,
  Emphasis,
};

export const render = (segments: Segment[]): JSX.Element | null => {
  console.log([...segments]);
  const head = segments.pop();
  if (head === undefined) {
    return null;
  } else if (head.event.kind === 'Start') {
    // A loop consumes events until it meets the corresponding `End` event.

    const { tag } = head.event;
    const { name } = tag;
    const Renderer = containerTag.hasOwnProperty(name) ? containerTag[name] : Default;
    const inner = [];
    while (segments.length !== 0) {
      const nextHead = segments[segments.length - 1];
      if (nextHead.event.kind === 'End' && nextHead.event.tag.name === name) {
        segments.pop();
        return <Renderer key={key(head.range)} children={inner} range={head.range} tag={head.event.tag} />;
      }
      const result = render(segments);
      if (result !== null) {
        inner.push(result);
      }
    }
    throw Error('encounter a unbalanced tag');
  } else if (head.event.kind === 'Text') {
    return <Text key={key(head.range)} text={head.event.text} range={head.range} />;
  } else if (head.event.kind === 'Unsupported') {
    return <Unsupported range={head.range} />;
  } else {
    console.error(head.event);
    throw Error('Unexpected tag');
  }
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
    // console.log(parser(source));
  }
  return (
    <div className="Content" onClick={edit}>
      {startRender(parser, source)}
    </div>
  );
};
