import React, { useEffect } from 'react';
import { Id, Item } from '../Item';
import { Children } from './Children';
import * as actions from '../actions';
import { gotoNext } from '../actions';
import { useDispatch } from './List';
import { Editor } from './Editor';
import { editMode, Mode, normalMode } from '../tree';
import { EDIT_MODE } from '../constants';
import './Root.scss';
import { Dispatch } from '../App';

interface Props {
  root: Item;
  mode: Mode;
  realRoot: Id;
}

const empty = () => {
  // empty function
};

const useAutoCreate = (dispatch: Dispatch, realRoot: Id, root: Item) => {
  useEffect(() => {
    if (root.children.size === 0 && realRoot === root.id) {
      dispatch(actions.create(Item.create('', root.id)));
    }
  }, [root]);
};

const Root = ({ realRoot, root, mode }: Props) => {
  const dispatch = useDispatch();
  useAutoCreate(dispatch, realRoot, root);
  const handleChange = (text: string) => {
    dispatch(actions.edit(root.id, text));
  };
  const editing = mode.type === EDIT_MODE && mode.id === root.id;
  const edit = () => {
    dispatch(actions.switchMode(editMode(root.id)));
  };
  const exitEdit = () => {
    dispatch(actions.switchMode(normalMode()));
  };
  const create = () => {
    const newItem = Item.create('', root.id);
    dispatch(actions.create(newItem));
  };
  const goNext = () => {
    dispatch(gotoNext(root.id));
  };

  const editor = (
    <Editor
      onChange={handleChange}
      source={root.source}
      editing={editing}
      modified={root.modified}
      swapUp={empty}
      swapDown={empty}
      unIndent={empty}
      indent={empty}
      create={create}
      remove={empty}
      toggle={empty}
      edit={edit}
      gotoNext={goNext}
      gotoPrev={empty}
      exitEdit={exitEdit}
      zoom={empty}
    />
  );

  return (
    <div className="Root">
      {realRoot === root.id ? null : editor}
      <Children item={root} parentDragging={false} />
    </div>
  );
};

export default Root;
