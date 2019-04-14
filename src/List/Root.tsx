import React, { useEffect } from 'react';
import { Item } from '../Item';
import { Children } from './Children';
import { create } from '../actions';
import { useDispatch } from './List';

interface Props {
  root: Item;
}

const useAutoCreate = (root: Item) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (root.children.size === 0) {
      dispatch(create(Item.create('', root.id)));
    }
  }, [root]);
};

const Root = ({ root }: Props) => {
  useAutoCreate(root);
  return <Children item={root} parentDragging={false} />;
};

export default Root;
