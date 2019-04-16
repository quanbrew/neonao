import React from 'react';
import { Item } from '../Item';
import { Children } from './Children';
import * as actions from '../actions';
import { gotoNext } from '../actions';
import { useDispatch } from './List';
import { Editor } from './Editor';
import { editMode, Mode, normalMode } from '../tree';
import { EDIT_MODE } from '../constants';
import './Root.scss';

interface Props {
  root: Item;
  mode: Mode;
}

const empty = () => {
  // empty function
};

const Root = ({ root, mode }: Props) => {
  const dispatch = useDispatch();
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

  return (
    <div className="Root">
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
      <Children item={root} parentDragging={false} />
    </div>
  );
};

export default Root;
