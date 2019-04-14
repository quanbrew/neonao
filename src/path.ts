import { Id } from './Item';

const itemPathRegex = /^\/id\/([0-9a-zA-Z\-]+)\/?$/;

export const getIdInPath = (path: string): Id | null => {
  const match = path.match(itemPathRegex);
  return match ? match[1] : null;
};

export const makePathById = (id: Id | null): string => {
  if (!id) {
    return '/';
  } else {
    return `/id/${id}`;
  }
};
