import React, { useEffect } from 'react';
import { loadTreeState } from '../tree';
import { Item } from '../Item';
import { Children } from './Children';
import { create, fetchAll } from '../actions';
import { useDispatch } from './List';

interface Props {
  root: Item | null;
}

const Loading = () => (
  <div className="items-loading">
    <p>Loading Items Data...</p>
  </div>
);

const useLoadRoot = (root: Item | null) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (root === null) {
      dispatch(fetchAll());
      loadTreeState(3).then(dispatch);
    } else if (root.children.size === 0) {
      dispatch(create(Item.create('', root.id)));
    }
  }, [root]);
};

const Root = React.memo(({ root }: Props) => {
  useLoadRoot(root);
  if (root === null) {
    return <Loading />;
  } else {
    return <Children items={root.children} loaded={root.loaded} expand={true} parentDragging={false} />;
  }
});

export default Root;
