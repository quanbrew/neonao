import { MarkdownParser, useMarkdownParser } from '../parsers';
import { Segment, Tag } from 'neonao_parsers';
import React from 'react';
import './Content.scss';

type Range = [number, number];

const key = ([start, end]: Range): string => `${start}:${end}"`;

interface Props {
  source: string;
  edit: () => void;
}

const Text = ({ text, range }: { text: string; range: Range }) => {
  return <span key={key(range)}>{text}</span>;
};

interface ContainerTagProps {
  children: React.ReactChildren;
  range: Range;
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

const Code = ({ code }: { code: string; range: Range }) => {
  return <code>{code}</code>;
};

const Link = ({ children, tag }: ContainerTagProps) => {
  if (tag.type !== 'Link') {
    throw Error();
  } else {
    return (
      <a href={tag.url} title={tag.title}>
        {children}
      </a>
    );
  }
};

const Unsupported = ({  }: { range: Range }) => {
  return <del>[UNSUPPORTED]</del>;
};
const Paragraph = ({ children }: ContainerTagProps) => {
  return <p>{children}</p>;
};

const containerTag = {
  Paragraph,
  Strong,
  Link,
  Emphasis,
};

export const render = (segments: Segment[]): JSX.Element | null => {
  const head = segments.pop();
  if (head === undefined) {
    return null;
  } else if (head.event.type === 'Start') {
    // A loop consumes events until it meets the corresponding `End` event.

    const { tag } = head.event;
    const { type } = tag;
    const Renderer = containerTag.hasOwnProperty(type) ? containerTag[type] : Default;
    const inner = [];
    while (segments.length !== 0) {
      const nextHead = segments[segments.length - 1];
      if (nextHead.event.type === 'End' && nextHead.event.tag.type === type) {
        segments.pop();
        return <Renderer key={key(head.range)} children={inner} range={head.range} tag={head.event.tag} />;
      }
      const result = render(segments);
      if (result !== null) {
        inner.push(result);
      }
    }
    throw Error('encounter a unbalanced tag');
  } else if (head.event.type === 'Text') {
    return <Text key={key(head.range)} text={head.event.text} range={head.range} />;
  } else if (head.event.type === 'Code') {
    return <Code key={key(head.range)} range={head.range} code={head.event.code} />;
  } else if (head.event.type === 'SoftBreak') {
    return null;
  } else if (head.event.type === 'HardBreak') {
    return <br key={key(head.range)} />;
  } else if (head.event.type === 'End') {
    throw Error('unexpected `End` tag');
  } else {
    return <Unsupported key={key(head.range)} range={head.range} />;
  }
};

const startRender = (parser: MarkdownParser | null, source: string): JSX.Element[] => {
  if (parser === null) {
    return [<span key="source">{source}</span>];
  } else {
    const parsed = parser(source);
    console.groupCollapsed(source);
    for (const element of parsed) {
      console.log(element.event.type, element.event);
    }
    console.groupEnd();
    const segments = parsed.reverse();
    const elements = [];
    while (segments.length !== 0) {
      const rendered = render(segments);
      if (rendered !== null) {
        elements.push(rendered);
      }
    }
    return elements;
  }
};

export const Content = ({ source, edit }: Props) => {
  const parser = useMarkdownParser();
  return (
    <div className="Content" onClick={edit}>
      {startRender(parser, source)}
    </div>
  );
};
