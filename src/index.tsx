import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import './index.css';
import { connect, Provider } from 'react-redux';
import { store } from './store';
import { loadTreeState } from "./tree";
import { Dispatch } from "redux";
import { fetchAll, redo, undo } from "./actions";
import { isRedoKey, isUndoKey } from "./keyboard";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faUndo } from '@fortawesome/free-solid-svg-icons';
import Root from "./list/Root";


interface Props {
  init: () => void;
  undo: () => void;
  redo: () => void;
}


const mapStateToProps = (): {} => ({});


const mapDispatchToProps = (dispatch: Dispatch): Pick<Props, 'init' | 'undo' | 'redo'> => {
  const init = () => {
    dispatch(fetchAll());
    loadTreeState(3).then(dispatch);
  };
  const performUndo = () => dispatch(undo);
  const performRedo = () => dispatch(redo);
  return { init, undo: performUndo, redo: performRedo };
};


class App extends React.Component<Props> {
  componentDidMount() {
    this.props.init();
  }


  render() {
    return (
      <div>
        <header><a className='app-name' href='/'>NeoNao</a></header>
        <button onClick={ this.props.undo } id="undo"><FontAwesomeIcon icon={ faUndo }/></button>
        <button onClick={ this.props.redo } id="redo"><FontAwesomeIcon icon={ faRedo }/></button>
        <Root/>
      </div>
    );
  }
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(DragDropContext(HTML5Backend)(App));


ReactDOM.render(
  <Provider store={ store }><ConnectedApp/></Provider>,
  document.getElementById('root') as HTMLElement
);


document.onkeydown = e => {
  const undoButton = document.getElementById('undo') as HTMLButtonElement;
  const redoButton = document.getElementById('redo') as HTMLButtonElement;

  const click = (button: HTMLButtonElement) => {
    button.click();
  };

  if (isUndoKey(e)) {
    click(undoButton);
  } else if (isRedoKey(e)) {
    click(redoButton);
  }
};
