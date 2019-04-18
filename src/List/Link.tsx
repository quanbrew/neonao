import * as React from 'react';
import { makePathById } from '../path';
import { Id } from '../Item';

interface Props {
  target: Id;
  children: React.ReactChild;
  className?: string;
}

export const Link = ({ target, children, className }: Props) => {
  const handleClick: React.MouseEventHandler = e => {
    e.preventDefault();
  };
  return (
    <a className={className} href={makePathById(target)} onClick={handleClick}>
      {children}
    </a>
  );
};
