import React from 'react'
import TextField from "@material-ui/core/TextField";
export class AddText extends React.Component {

    state = {
        text: ''
    }
    handleValueChange = (ev) => {
        const text = ev.target.value;
        this.setState({ text })
    }
    onSubmit = (ev) => {
        ev.preventDefault();
        if (!this.state.text) return;
        (this.props.type === 'Card') && this.props.updateState('isAddCard', false)

        this.props.onAdd(this.props.type, this.state.text, this.props.groupId)
        this.setState({ text: '' })
    }
    onRemoveTextEditor = () => {
        let isAddType = (this.props.type==='Card')?'isAddCard':'isAddGroup'
        this.props.updateState (isAddType, false)
        this.setState({ text: '' })
    }

    render() {
        return (
            <div className="adding-div flex column">
                <form onSubmit={this.onSubmit}>
                    
                    {/* <TextField  className="title-input" value={this.state.text} onChange={this.handleValueChange} type="text" id="outlined-basic" label="Outlined" variant="outlined" placeholder={this.props.type === 'Card' ? "Card name" : "List name"} /> */}
                    <input className="title-input" placeholder={this.props.type === 'Card' ? "Card name" : "List name"}
                        type="text"
                        onChange={this.handleValueChange}
                        value={this.state.text}
                    />
                    <div className="flex">
                        <button className="btn" onClick={this.onSubmit}>{this.props.type === 'Card' ? "Add Card" : "Add List"}</button>
                        <button className="btn" onClick={this.onRemoveTextEditor}>X</button>
                    </div>
                    
               
                </form>

            </div>
        )
    }
}
