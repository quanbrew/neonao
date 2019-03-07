import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import { style } from "typestyle";
import { connect, Provider } from 'react-redux';
import { store } from './store';
import ListNode from "./ListNode";
import { Item } from "./Item";
import { TreeState } from "./reducers";
import { Dispatch } from "redux";
import { fetchAll } from "./actions";


interface Props {
  root?: Item;
  init: () => void;
}


const mapStateToProps = (state: TreeState): Pick<Props, 'root'> => {
  let props: Pick<Props, 'root'> = {};
  for (let key in state) {
    if (!state[key].parent)
      props.root = state[key];
  }
  return props;
};


const mapDispatchToProps = (dispatch: Dispatch): Pick<Props, 'init'> => {
  return { init: () => (dispatch(fetchAll())) };
};


class App extends React.Component<Props> {
  componentDidMount() {
    this.props.init();
  }

  render() {
    const title = style({
      fontWeight: "normal",
      fontSize: 18,
    });

    return (
      <div>
        <h1 className={ title }>NeoNao</h1>
        { this.props.root ? <ListNode id={ this.props.root.id }/> : 'Loading...' }
      </div>
    );
  }
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);


ReactDOM.render(
  <Provider store={ store }><ConnectedApp/></Provider>,
  document.getElementById('root') as HTMLElement
);
