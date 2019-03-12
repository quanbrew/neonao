import * as React from 'react';
import { ID, Item } from "../Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Editor, EditorState } from 'draft-js';
import { Tree } from "../tree";
import { create, loadItemState, remove, update } from "../actions";
import './ListNode.css';
import iconRemove from "./delete.svg";
import iconCreate from "./plus-square.svg";


export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const IconRemove = (props: ImageProps) => (
  <img src={ iconRemove } alt="Remove" { ...props } />
);

export const IconCreate = (props: ImageProps) => (
  <img src={ iconCreate } alt="Create" { ...props } />
);



interface Props {
  id: ID;
  item: Item;
  create: () => void;
  remove: () => void;
  update: (item: Item) => void;
  load: (item: Item) => void;
}


interface State {
  editor: EditorState | null;
}


class ListNode extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { editor: null };
  }


  renderChild = (childID: ID) => <ConnectedListNode key={ childID } id={ childID }/>;

  dummyChildren = () => {
    const length = this.props.item.children.size;
    let dummyList = [];
    for (let i = 0; i < length; i++) {
      dummyList.push(<li key={ i }>Loading...</li>);
    }
    return dummyList;
  };

  renderChildren = () => {
    const { item } = this.props;
    if (item.loaded) {
      return <ul>{ item.children.map(this.renderChild) }</ul>
    } else {
      return <ul>{ this.dummyChildren() }</ul>
    }
  };

  submitChange = (editor: EditorState) => {
    const { item, update } = this.props;
    const source = editor.getCurrentContent().getPlainText();
    const next: Item = { ...item, editor, source };
    update(next);
  };

  onChange = (editor: EditorState) => {
    this.submitChange(editor);
  };

  getEditor = () => {
    const { item } = this.props;
    if (item.editor === null) {
      return Item.initEditorState(item);
    } else {
      return item.editor;
    }
  };

  componentDidMount() {
    const { item, load } = this.props;
    if (!item.loaded) {
      load(item)
    }
  }

  render() {
    const { remove, create } = this.props;

    return (
      <li className="ListNode">
        <Editor editorState={ this.getEditor() } onChange={ this.onChange }/>
        <IconCreate className="icon create-item" onClick={ create }/>
        <IconRemove className="icon remove-item" onClick={ remove }/>
        { this.renderChildren() }
      </li>
    );
  }
}


type StateProps = Pick<Props, 'item'>;

const mapStateToProps = (state: Tree, { id }: Props) => (state: Tree): StateProps => {
  const item = state.map.get(id) as Item;
  return { item };
};


type DispatchProps = Pick<Props, 'create' | 'remove' | 'load' | 'update'>;

const mapDispatchToProps = (dispatch: Dispatch, props: Pick<Props, 'id'>) => {
  const id = props.id;
  const createItem = () => dispatch(create(Item.create("", id)));
  const removeItem = () => dispatch(remove(id));
  const load = (item: Item) => loadItemState(item).then(dispatch);
  const updateItem = (item: Item) => dispatch(update(item));
  return (): DispatchProps => ({ create: createItem, remove: removeItem, load, update: updateItem });
};


export const ConnectedListNode = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ListNode);
export default ConnectedListNode;
