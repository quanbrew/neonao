import React, { useEffect } from 'react';
import { loadTreeState, Tree } from '../tree';
import { connect } from 'react-redux';
import { ID, Item } from '../Item';
import { Children } from './Children';
import { Dispatch } from 'redux';
import { create, fetchAll } from '../actions';
import { emptyEditor } from '../editor';

interface Props {
  root: Item | null;
  init: () => void;
  createEmpty: (parent: ID) => void;
}

const Loading = () => (
  <div className="items-loading">
    <p>Loading Items Data...</p>
  </div>
);

const Root = ({ root, init, createEmpty }: Props) => {
  useEffect(() => {
    if (root === null) {
      init();
    } else if (root.children.size === 0) {
      createEmpty(root.id);
    }
  });

  if (root === null) {
    return <Loading />;
  } else {
    return <Children items={root.children} loaded={root.loaded} expand={true} parentDragging={false} />;
  }
};

type TStateProps = Pick<Props, 'root'>;

const mapStateToProps = ({ root, map }: Tree): TStateProps => ({ root: root ? map.get(root) || null : null });

type TDispatchProps = Pick<Props, 'init' | 'createEmpty'>;

const mapDispatchToProps = (dispatch: Dispatch): TDispatchProps => {
  const init = () => {
    dispatch(fetchAll());
    loadTreeState(3).then(dispatch);
  };
  const createEmpty = (parent: ID) => dispatch(create(Item.create(emptyEditor, parent)));
  return { init, createEmpty };
};

export default connect<TStateProps, TDispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(Root);
