import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import { connect, Provider } from 'react-redux';
import { store } from './store';
import ListNode from "./ListNode";
import { Tree } from "./reducers";
import { Dispatch } from "redux";
import { fetchAll } from "./actions";


interface Props {
  root: string | null;
  init: () => void;
}


const mapStateToProps = ({ root }: Tree): Pick<Props, 'root'> => ({ root });


const mapDispatchToProps = (dispatch: Dispatch): Pick<Props, 'init'> => {
  return { init: () => (dispatch(fetchAll())) };
};


class App extends React.Component<Props> {
  componentDidMount() {
    this.props.init();
  }

  render() {
    return (
      <div>
        <header><a className='app-name' href='/'>NeoNao</a></header>
        <ul>{ this.props.root ? <ListNode id={ this.props.root }/> : 'Loading...' }</ul>
      </div>
    );
  }
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);


ReactDOM.render(
  <Provider store={ store }><ConnectedApp/></Provider>,
  document.getElementById('root') as HTMLElement
);
