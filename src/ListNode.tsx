import * as React from 'react';
import { ID, Item } from "./Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Tree } from "./tree";
import { create, loadItemState, remove } from "./actions";
import { IconCreate, IconRemove } from "./icons";
import './ListNode.css';


interface Props {
  id: ID;
  item: Item;
  loaded: boolean;
  create: () => void;
  remove: () => void;
  load: (item: Item) => void;
}


class ListNode extends React.Component<Props> {
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

  componentDidMount() {
    const { item, load } = this.props;
    if (!item.loaded) {
      setTimeout(() => load(item), 0);
      // load(item)
    }
  }

  render() {
    const { item, remove, create } = this.props;
    return (
      <li className="ListNode">
        <span className='content'>{ item.source }</span>
        <IconCreate className="icon create-item" onClick={ create }/>
        <IconRemove className="icon remove-item" onClick={ remove }/>
        <ul>{ this.renderChildren() }</ul>
      </li>
    );
  }
}


type StateProps = Pick<Props, 'item' | 'loaded'>;

const mapStateToProps = (state: Tree, { id }: Props) => (state: Tree): StateProps => {
  const item = state.map.get(id) as Item;
  return { item, loaded: item.loaded };
};


type DispatchProps = Pick<Props, 'create' | 'remove' | 'load'>;

const mapDispatchToProps = (dispatch: Dispatch, props: Pick<Props, 'id'>) => {
  const id = props.id;
  const createItem = () => dispatch(create(Item.create(String(Math.random()), id)));
  const removeItem = () => dispatch(remove(id));
  const load = (item: Item) => loadItemState(item).then(dispatch);
  return (): DispatchProps => ({ create: createItem, remove: removeItem, load });
};


export const ConnectedListNode = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ListNode);
export default ConnectedListNode;
