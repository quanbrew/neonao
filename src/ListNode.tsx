import * as React from 'react';
import { ID, Item } from "./Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { TreeState } from "./reducers";
import { create, remove } from "./actions";


interface Props {
  id: ID;
  item: Item;
  create: () => void;
  remove: () => void;
}


class ListNode extends React.Component<Props> {
  handleClick = () => {
    this.props.create();
  };

  handleRemove = () => {
    this.props.remove();
  };

  render() {
    const children = this.props.item.children.map(
      id => <ConnectedListNode key={ id } id={ id }/>
    );

    return (
      <li><span onClick={ this.handleClick }>{ this.props.item.source }</span> <span><a
        onClick={ this.handleRemove }>REMOVE</a></span>
        <ul>{ children }</ul>
      </li>
    );
  }
}


type StateProps = Pick<Props, 'item'>;

const mapStateToProps = (state: TreeState, { id }: Props) => (state: TreeState): StateProps => {
  return { item: state[id] };
};


type DispatchProps = Pick<Props, 'create' | 'remove'>;

const mapDispatchToProps = (dispatch: Dispatch, props: Pick<Props, 'id'>) => {
  const id = props.id;
  const createItem = () => dispatch(create(Item.create('New', id)));
  const removeItem = () => dispatch(remove(id));
  return (): DispatchProps => ({ create: createItem, remove: removeItem });
};


export const ConnectedListNode = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ListNode);
export default ConnectedListNode;
