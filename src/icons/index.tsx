import * as React from 'react';
import iconRemove from "./delete.svg";
import iconCreate from './plus-square.svg';


export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;


export const IconRemove = (props: ImageProps) => (
  <img src={ iconRemove } alt="Remove" { ...props } />
);

export const IconCreate = (props: ImageProps) => (
  <img src={ iconCreate } alt="Create" { ...props } />
);
