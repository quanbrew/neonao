import * as React from 'react';
import { makePathById } from '../path';
import { Id } from '../Item';
import { useViewDispatch } from './List';
import { zoom } from '../actions';

interface Props {
  target: Id;
  children: React.ReactChild;
  className?: string;
}

export const Link = ({ target, children, className }: Props) => {
  const dispatch = useViewDispatch();
  const handleClick: React.MouseEventHandler = e => {
    e.preventDefault();
    dispatch(zoom(target));
  };
  return (
    <a className={className} href={makePathById(target)} onClick={handleClick}>
      {children}
    </a>
  );
};
