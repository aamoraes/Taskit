import React, { Component } from "react";
import { connect } from "react-redux";
import StickyBox from "react-sticky-box";
import LinearProgress from '@material-ui/core/LinearProgress';
import { cleanBoard,loadBoard, updateBoard, updateBoardFromSocket,addBoard } from "../store/actions/boardActions";
import { BoardHeader } from "../cmps/BoardHeader";
import { CardList } from "../cmps/CardList";
import { CardDetails } from "../cmps/CardDetails";
import { DragDropContext } from "react-beautiful-dnd";
import { AddText } from "../cmps/AddText";
import { boardService } from "../services/boardService";
import socketService from '../services/socketService';


export class _BoardDetails extends Component {
  state = {
    isDetailsShown: false,
    isAddGroup: false,
    board:null

  };

  componentDidMount ()  {
    const { boardId } = this.props.match.params;
    this.props.loadBoard(boardId);
    
    socketService.setup();
    socketService.emit('connect to board', boardId);
    socketService.on('send updated board', this.props.updateBoardFromSocket);
  }

  componentWillUnmount() {
    socketService.terminate();
    this.props.cleanBoard()  
  }
 
  updateState = (key, val) => {
    this.setState({ [key]: val });
  };
  onEditGroup = () => {
    this.setState({ isAddGroup: true });
  };

  onAdd = (type, text, groupId) => {
    const newboard = { ...this.props.board };
    const groupIdx = newboard.groups.findIndex((group) => group.id === groupId);
    if (type === "Group") {
      this.setState({ isAddGroup: false });
      const group = { id: "g" + boardService.makeId(), title: text, cards: [] };
      newboard.groups.push(group);
      this.props.updateBoard(newboard);
    } else if (type === "Card") {
      const card = { id: "c" + boardService.makeId(), title: text };
      newboard.groups[groupIdx].cards.push(card);
      this.props.updateBoard(newboard);
    }
  };

  updateState = (key, val) => {
    this.setState({ [key]: val })
  }
  onEditGroup = () => {
    this.setState({ isAddGroup: true })
  }
  onDragEnd = result => {
    const { destination, source, draggableId } = result;
    const columns = this.props.board.groups// groups are called columns in this func
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = columns.find(start => start.id === source.droppableId);//finding the group from which a drag was started
    const finish = columns.find(finish => finish.id === destination.droppableId);//finding the group from which a drag was ended

    if (start === finish) {//in-group movements of cards
      const newTaskIds = Array.from(start.cards);
      const shiftedTask = newTaskIds.find(task => task.id === draggableId)//i added this code-line since the tutorial lacked it

      newTaskIds.splice(source.index, 1)
      newTaskIds.splice(destination.index, 0, shiftedTask)//and this 'shiftedTask' var as well 


      const newColumn = {
        ...start,
        cards: newTaskIds,
      }

      const newGroups = Array.from(columns);


      const groupIdx = columns.findIndex(group => group.id === newColumn.id)

      newGroups.splice(groupIdx, 1, newColumn)

      const newState = {
        ...this.props.board,
        groups: newGroups
      }
      this.props.updateBoard(newState)
      return;
    }
    // inter-groups-movement of cards:
    const startTaskIds = Array.from(start.cards); //array-copy of the cards at the start-column
    const shiftedTask = startTaskIds.find(task => task.id === draggableId)//(my-code) targeting the card i wish to DND and putting it as a var
    startTaskIds.splice(source.index, 1);//cutting one card out at the start-column
    const newStart = {
      ...start,
      cards: startTaskIds
    } // creating a start column variable that is spread and also updated with cards (one card less..)


    const finishtaskIds = Array.from(finish.cards);
    finishtaskIds.splice(destination.index, 0, shiftedTask)
    const newFinish = {
      ...finish,
      cards: finishtaskIds
    }

    const newGroups = Array.from(columns);
    //here i need to prepare the final stage where i take the groups array, and make it updated. then i could send it to the newState.
    const startGroupIdx = newGroups.findIndex(group => group.id === newStart.id)
    const finishGroupIdx = newGroups.findIndex(group => group.id === newFinish.id)

    newGroups.splice(startGroupIdx, 1, newStart)
    newGroups.splice(finishGroupIdx, 1, newFinish)

    const newState = {
      ...this.props.board,
      groups: newGroups
    }
    this.props.updateBoard(newState)
    return;
  }
  onRemoveGroup = (groupId) => {
    var newboard = { ...this.props.board };
    newboard.groups = newboard.groups.filter((group) => group.id !== groupId);
    this.props.updateBoard(newboard);
  };
  onRemoveCard = (cardId) => {
    var newboard = JSON.parse(JSON.stringify(this.props.board));
    const groupIdx = newboard.groups.findIndex(
      (group) => group.id === this.state.isDetailsShown.groupId
    );
    const newCards = Array.from(newboard.groups[groupIdx].cards);
    const cardIdx = newCards.findIndex((card) => card.id === cardId);
    newCards.splice(cardIdx, 1);
    newboard.groups[groupIdx].cards = newCards;
    this.props.updateBoard(newboard);
  };
  addTemplateToBoards  =async()=>{
    let {board}=this.props
    await this.props.addBoard(board.title,board.style.bgImg)
    const {boards}=this.props
    const newBoard = boards.find(newBoard=>((newBoard.title===board.title)&&(newBoard.style.bgImg===board.style.bgImg)&&(!('isTemplate' in newBoard))
    ))
    console.log(newBoard)
    board._id =newBoard._id
    delete board.isTemplate
    this.props.updateBoard(board) 
    this.props.history.push('/board')

  }

  render() {
    const { board } = this.props
    
    if (board===null) return <LinearProgress />
    return (
      <div className="board-details " style={{ backgroundImage: `url(${board.style.bgImg ? board.style.bgImg : ''})`, backgroundSize: "cover", backgroundRepeat: "no-repeat", minHeight: "90vh", backgroundColor: `${board.style.bgColor ? board.style.bgColor : ''}` }} >

        <BoardHeader board={board}  updateBoard={this.props.updateBoard}/>


        <DragDropContext onDragEnd={this.onDragEnd}>
          <StickyBox className="groups-container flex">
            {board.groups.map(group => <CardList onAdd={this.onAdd} group={group} key={group.id} updateState={this.updateState} onRemoveGroup={this.onRemoveGroup} />)}
            {this.state.isAddGroup ?
              <AddText updateState={this.updateState} onAdd={this.onAdd} type="Group" groupId={null} />
              :
              <button className="add-group btn" onClick={() => this.onEditGroup()}>Add List</button>
            }
          </StickyBox>
        </DragDropContext>

        {this.state.isDetailsShown.cardId &&
          <CardDetails updateState={this.updateState} onRemoveCard={this.onRemoveCard} cardId={this.state.isDetailsShown.cardId} groupId={this.state.isDetailsShown.groupId} />}
           {board.isTemplate && <footer onClick={this.addTemplateToBoards}> Use This Board</footer>}
      </div>
     
    )
  }
}

const mapStateToProps = (state) => {
  return {
    board: state.boardReducer.currBoard,
    boards: state.boardReducer.boards,
  };
};
const mapDispatchToProps = {
  loadBoard,
  updateBoard,
  updateBoardFromSocket,
  cleanBoard,
  addBoard
};
export const BoardDetails = connect(
  mapStateToProps,
  mapDispatchToProps
)(_BoardDetails);
