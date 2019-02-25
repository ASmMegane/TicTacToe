import React, { Component } from 'react';
import './App.css';
import "bootstrap/dist/css/bootstrap.css";
import {Card, Button, CardColumns, Form, Col, ButtonGroup} from 'react-bootstrap';

const myServer =      'http://localhost:3000/games/list';
const myServerDeleteGame = 'http://localhost:3000/games/delete';
const myServerState = 'http://localhost:3000/games/state';
const myServerNew = 'http://localhost:3000/games/new';
const myServerJoin = 'http://localhost:3000/games/join';
const myServerDoStep = 'http://localhost:3000/games/do_step';
const myStyleBtn = { width: '10rem', height: '10rem'};


class CellField extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDisable : this.props.isDisable,
            row : this.props.row,
            cow : this.props.cow,
            valueCell : this.props.cellValue,
        };
        this.WhenClicked = this.WhenClicked.bind(this);
    }

    componentWillReceiveProps(nextProps){
        this.setState({valueCell: nextProps.cellValue, isDisable: nextProps.isDisable})
    }

    WhenClicked =  () => {
        this.props.clickFieldButton(this.state.row, this.state.cow);
    };

    render() {
        return (
            <div>
                <Button style={myStyleBtn} variant="outline-secondary" disabled={(this.state.valueCell !== ' ') || this.state.isDisable}
                        onClick={() => {this.WhenClicked()}}
                >
                    {this.state.valueCell}
                </Button>
            </div>
        )
    }
}

class Game extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isDisableButtonField : true,
            intervalKey : null,
            isNew : this.props.isNew,
            nameOpponent : '',
            namePlayer : this.props.name,
            gameToken : this.props.gameToken,
            accessToken : '',
            resServer : {},
            field : [[' ', ' ', ' '],[' ', ' ', ' '],[' ', ' ', ' ']],
            winner : ''
        };
        this.queryServer = this.queryServer.bind(this);
        this.pressBackBtn = this.pressBackBtn.bind(this);
        this.updateGame = this.updateGame.bind(this);
        this.clickFieldButton = this.clickFieldButton.bind(this);
        this.deleteGame = this.deleteGame.bind(this);
    }

    componentWillUnmount() {
        setTimeout(this.deleteGame, 10000);
    }

    async clickFieldButton(row, cow){
        const res = await fetch(myServerDoStep, {
            method: 'post',
            body: JSON.stringify({
                row : row,
                cow : cow,
                accessToken : this.state.accessToken,
                gameToken : this.state.gameToken
            }),
            headers: { "Content-Type": "application/json" }
        }).then(()=> {
            this.updateGame();
            let key = setInterval( this.updateGame, 2000);
            this.setState({intervalKey: key, isDisableButtonField : true});
        });

    }

    deleteGame () {
        fetch(myServerDeleteGame, {
            method: 'post',
            body: JSON.stringify({
                gameToken : this.state.gameToken
            }),
            headers: { "Content-Type": "application/json" }
        });
    }

    pressBackBtn() {
        if (this.state.resServer.state_id === 2) {
            this.props.updateStateAppG('menu', 'stateApp');
            clearInterval(this.state.intervalKey);
            this.deleteGame();
        } else if (this.state.resServer.state_id === 3){
            this.props.updateStateAppG('menu', 'stateApp');
        }
    }

    updateGame(){
        this.queryServer(myServerState, 'post').then(()=>{
            if (this.state.resServer.state_id === 3){
                clearInterval(this.state.intervalKey);
                 switch (this.state.resServer.winner){
                    case 1 : this.setState({isDisableButtonField : true, winner : this.state.resServer.name_1}); break;
                    case 2 : this.setState({isDisableButtonField : true, winner : this.state.resServer.name_2}); break;
                    case 3 : this.setState({isDisableButtonField : true, winner : 'not determined'}); break;
                }
            }else if (((this.state.resServer.whoTurn === 1 && this.state.isNew) || (this.state.resServer.whoTurn === 2 && !this.state.isNew))
                &&  this.state.resServer.state_id !== 2
            ){
                clearInterval(this.state.intervalKey);
                this.setState({isDisableButtonField : false})
            }
        });
    }


    componentDidMount() {
        if (this.state.isNew) {
            this.queryServer(myServerNew, 'post').then(() =>{
                this.setState({accessToken: this.state.resServer.accessToken_1, gameToken: this.state.resServer.Token});
            });

        } else {
            this.queryServer(myServerJoin, 'post').then(()=>{
                this.setState({accessToken: this.state.resServer.accessToken_2, nameOpponent : this.state.resServer.name_1});
            });
        }
        let key = setInterval( this.updateGame, 2000);
        this.setState({intervalKey: key });
    }



    async queryServer(url, method){
        const res = await fetch(url, {
            method: method,
            body: JSON.stringify({
                gameToken : this.state.gameToken,
                accessToken : this.state.accessToken,
                playerName : this.state.namePlayer
            }),
            headers: { "Content-Type": "application/json" }

        });
        const jsonRes= await res.json();
        this.setState({resServer : jsonRes.game, field : jsonRes.field});
    }


    render() {
        return (
            <div>
                <Form>
                    <Form.Row>
                        <Col>
                            <Button variant="primary"
                                    onClick={()=>
                                    {this.pressBackBtn()}}
                            >
                                Back
                            </Button>
                        </Col>
                        <Form.Group as={Col} controlId="Player 1">
                            <Form.Label>Player 1</Form.Label>
                            <Form.Control readOnly defaultValue={ this.state.isNew ? this.state.namePlayer : this.state.nameOpponent} />
                        </Form.Group>
                        <Col></Col>
                        <Col as={Col}>
                            <Form.Control plaintext readOnly defaultValue="VS" />
                        </Col>

                        <Form.Group as={Col} controlId="Player 1">
                            <Form.Label>Player 2</Form.Label>
                            <Form.Control readOnly defaultValue={this.state.isNew ? this.state.nameOpponent : this.state.namePlayer} />
                        </Form.Group>
                        <Col></Col>
                    </Form.Row>
                    Winner:
                    {this.state.winner}
                </Form>
                <ButtonGroup vertical disabled>
                    <ButtonGroup>
                        <CellField cellValue={this.state.field[0][0]} row={0} cow={0} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                        <CellField cellValue={this.state.field[0][1]} row={0} cow={1} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                        <CellField cellValue={this.state.field[0][2]} row={0} cow={2} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                    </ButtonGroup>
                    <ButtonGroup>
                        <CellField cellValue={this.state.field[1][0]} row={1} cow={0} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                        <CellField cellValue={this.state.field[1][1]} row={1} cow={1} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                        <CellField cellValue={this.state.field[1][2]} row={1} cow={2} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                    </ButtonGroup>
                    <ButtonGroup>
                        <CellField cellValue={this.state.field[2][0]} row={2} cow={0} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                        <CellField cellValue={this.state.field[2][1]} row={2} cow={1} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                        <CellField cellValue={this.state.field[2][2]} row={2} cow={2} isDisable={this.state.isDisableButtonField} clickFieldButton={this.clickFieldButton}/>
                    </ButtonGroup>
                </ButtonGroup>
            </div>
        )
    }
}

class Menu extends Component {

    constructor(props) {
        super(props);
        this.state = {
            namePlayer : this.props.name,
        };

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange (event) {
        this.setState({ namePlayer: event.target.value });
        this.props.updateStateAppM(event.target.value, 'name')
    }

    render() {
        return (
            <div className="App">
                <Form>
                    <Form.Group controlId="formName">
                        <Form.Label>Enter your name</Form.Label>
                        <input type="text" value={this.state.namePlayer} onChange={this.handleChange}/>
                        <Button variant="primary"
                                onClick={()=>
                                {this.props.updateStateAppM('game', 'stateApp'); this.props.updateStateAppM(true,  'isNew')}}
                        >
                            CREATE
                        </Button>
                    </Form.Group>
                </Form>
                <CardsWithGames updateStateAppC = {this.props.updateStateAppM}
                />

            </div>
        );
    }
}

class CardsWithGames extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data : {code : '', game: [], status : ''},
            keyUpdate : null
        };
        {}
        this.updateGames = this.updateGames.bind(this);

    }

    updateGames(){
        fetch(myServer, {method: 'get'})

            .then(response => {
                return response.json()
            })
            .then(data => {
                this.setState({data : data})
            });
    }

    componentDidMount() {
        this.setState( {keyUpdate: setInterval( this.updateGames, 2000)})
        this.updateGames()
    }

    componentWillUnmount() {
        clearInterval(this.state.keyUpdate);
    }

    render() {
        return (
            <div>
                <CardColumns>
                    {this.state.data.game.map((gameData, idx) => (
                        <Card bg="light"
                              key = {idx}>
                            <Card.Header>
                                {'1 player: '}
                                {gameData.name_1}
                            </Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    vs
                                </Card.Text>
                                <Card.Text>
                                    {'2 player: '}
                                    {gameData.name_2}
                                </Card.Text>
                                <Button variant="primary" disabled={!(gameData.state_id === 2)}
                                        onClick={()=>{
                                            this.props.updateStateAppC('game', 'stateApp');
                                            this.props.updateStateAppC(false,  'isNew');
                                            this.props.updateStateAppC(gameData.Token,  'gameToken');
                                        }}
                                >
                                    Go
                                </Button>
                            </Card.Body>
                            <Card.Footer className="text-muted">
                                Time: {gameData.timeStartGame}
                            </Card.Footer>
                            <Card.Footer className="text-muted">
                                {'winner: '}
                                {gameData.winner === 1 ? gameData.name_1 : gameData.name_2}
                            </Card.Footer>
                        </Card>
                    ))}
                </CardColumns>
            </div>
        );
    }
}

class App extends Component {

    constructor() {
        super();
        this.state = {
            playGameToken : '',
            stateApp : 'menu',
            namePlayer : 'Your Name',
            isNew : null
        };
        this.updateState = this.updateState.bind(this);

    }

    updateState = (newState, nameChangeState) => {
        switch(nameChangeState){
            case 'name': {this.setState({namePlayer : newState })} return null;
            case 'stateApp' : {this.setState({stateApp : newState })}return null;
            case 'isNew' : {this.setState({isNew : newState })}return null;
            case 'gameToken' : {this.setState({playGameToken : newState })}return null;
        }
    };


    render() {
        if (this.state.stateApp === 'menu') {
            return (
                <div className="App">
                    <Menu updateStateAppM={this.updateState}  name={this.state.namePlayer}/>
                </div>
            );
        }else if (this.state.stateApp === 'game'){
            return(
            <div className="App">
                <Game updateStateAppG={this.updateState}
                      name={this.state.namePlayer}
                      isNew={this.state.isNew}
                      gameToken={this.state.playGameToken}/>
            </div>
            );
        }
    }
}


export default App;
