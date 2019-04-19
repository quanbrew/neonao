import React, { useEffect } from 'react';
import { Id, Item } from '../Item';
import { Children } from './Children';
import * as actions from '../actions';
import { gotoNext } from '../actions';
import { useDispatch, useView } from './List';
import { Editor } from './Editor';
import { Mode, normalMode } from '../state';
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

const Root = ({ realRoot, root, mode }: Props) => {
  const dispatch = useDispatch();
  const view = useView();
  const handleChange = (text: string) => {
    dispatch(actions.edit(root.id, text));
  };
  const editing = mode.type === EDIT_MODE && mode.id === root.id && view.id == mode.view;
  const edit = () => {
    dispatch(actions.focus(root.id, view.id));
  };
  const exitEdit = () => {
    dispatch(actions.switchMode(normalMode()));
  };
  const create = () => {
    const newItem = Item.create('', root.id);
    dispatch(actions.create(newItem));
  };
  const goNext = () => {
    dispatch(gotoNext(root.id, view.id));
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
