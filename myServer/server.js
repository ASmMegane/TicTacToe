let express = require('express');
let mysql = require("mysql");
let app = express();
let bodyParser = require('body-parser');


app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.header('Access-Control-Allow-Methods', 'GET,POST, DELETE');

    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    next();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = mysql.createPool({
    connectionLimit : 10,
    host: "localhost",
    user: "user",
    password: "222",
    database: "gameXO",
    multipleStatements: true
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

app.get('/games/list', function (req, res) {

    pool.query('SELECT * FROM gameXO.games',null,function(err,rows){
        if(err) throw err;
        res.json({
            'status' : 'ok',
            'code' : '0',
            'game' : rows
        });
    });
});

app.post('/games/state', function (req, res) {

    let gameToken = req.body.gameToken;
    pool.query('select * from gameXO.games where Token = ?; select * from gameXO.field where gameToken = ?;', [gameToken, gameToken], function(err,rows){
        if(err) throw err;
        let field = [
            [' ', ' ', ' '],
            [' ', ' ', ' '],
            [' ', ' ', ' ']
        ];
        for (let i = 0; i < rows[1].length; i++)
        {
            let row = rows[1][i].RowCell;
            let cow = rows[1][i].CowCell;
            field[row][cow] = rows[1][i].state_cell;
        }
        res.json({
            'status' : 'ok',
            'code' : '0',
            'game' : rows[0][0],
            'field' : field
        });
    });
});


app.post('/games/new', function (req, res) {

    let gameToken = randomStr(20);
    let accessToken = randomStr(20);
    let namePlayer = req.body.playerName;
    let field = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' ']
    ];
    pool.query(
        'insert into gameXO.games ' +
        '(Token, accessToken_1, name_1, state_id, timeStartGame) ' +
        'values (?, ?, ?, 2, \'11.11.11\')', [gameToken, accessToken, namePlayer],function(err, result){
        if(err) throw err;
        res.json({
            'status' : 'ok',
            'code' : '0',
            'game' : {
                Token : gameToken,
                accessToken_1: accessToken
            },
            'field' : field
        });
    });
});

app.post('/games/delete', function (req, res) {

    let gameToken = req.body.gameToken;
    pool.query('delete from gamexo.field where gameToken = ?;' +
        ' delete from gamexo.games where Token = ?', [gameToken, gameToken], function(err,rows){
        if(err) throw err;
        res.json({
            'status' : 'ok',
            'code' : '0'
        });
    });
});

app.post('/games/join', function (req, res) {

    let accessToken = randomStr(20);
    let gameToken = req.body.gameToken;
    let nameSecondPlayer = req.body.playerName;
    let field = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' ']
    ];

    pool.query('update gamexo.games set name_2 = ?, accessToken_2 = ?, state_id = 1 where Token = ?',
        [nameSecondPlayer, accessToken, gameToken], function (err) {
            if(err) throw err;
            pool.query('select * from gamexo.games where Token = ?', gameToken,function(err,rows){
                if(err) throw err;
                res.json({
                    'status' : 'ok',
                    'code' : '0',
                    'game' : rows[0],
                    'field' : field
                });
            });
        });

});

//-----------------------------------------------------------
//-------------------------do step---------------------------
//-----------------------------------------------------------

app.post('/games/do_step', function (req, res) {
    let row = req.body.row;
    let cow = req.body.cow;
    let gameToken = req.body.gameToken;


    pool.query('select whoTurn from gamexo.games where Token = ?', gameToken, function(err,rows){
        if(err) throw err;
        let valueCell = ((rows[0].whoTurn === 1) ? 'X' : 'O');
        let nextTurn = ((rows[0].whoTurn === 1) ? 2 : 1);
        pool.query('insert into gamexo.Field (gameToken, RowCell, CowCell, state_cell) values(?, ?, ?, ?);' +
            'update gamexo.games set whoTurn = ? where Token = ?;' +
            'select * from gamexo.Field where gameToken = ?', [gameToken, row, cow, valueCell, nextTurn, gameToken, gameToken],
            function(err, result){
                if(err) throw err;
                let isWin = checkWin(result[2]);
                if (isWin !== ' ')
                {
                    let winner = (isWin === 'X') ? 1 : 2;
                    pool.query('update gamexo.games set state_id = 3, winner = ? where Token = ?', [winner, gameToken],function (err){
                        if(err) throw err;
                        res.json({
                            'status': 'ok',
                            'code': '0'
                        });
                    })
                }else if (result[2].length === 9) {
                    pool.query('update gamexo.games set state_id = 3, winner = 3 where Token = ?', gameToken,function (err){
                        if(err) throw err;
                        res.json({
                            'status': 'ok',
                            'code': '0'
                        });
                    })
                }else {
                    res.json({
                        'status': 'ok',
                        'code': '0'
                    });
                }
        });
    });
});


//-----------------------------------------------------
randomStr = function(n){
    var s ='', abd ='abcdefghijklmnopqrstuvwxyz0123456789', aL = abd.length;
    while(s.length < n)
        s += abd[Math.random() * aL|0];
    return s;
};

function checkWin(rows) {
    let field = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' ']
    ];
    for (let i = 0; i < rows.length; i++)
    {
        let row = rows[i].RowCell;
        let cow = rows[i].CowCell;
        field[row][cow] = rows[i].state_cell;
    }
    for (let i = 0; i < 3; i++)
    {
        if (field[i][0] === field[i][1] && field[i][0] === field[i][2] && field[i][0] !== ' '){return field[i][0]}
    }
    for (let i = 0; i < 3; i++)
    {
        if (field[0][i] === field[1][i] && field[0][i] === field[2][i] && field[i][0] !== ' '){return field[0][i]}
    }
    if (field[0][0] === field[1][1] && field[0][0] === field[2][2] && field[1][1] !== ' ') {return field[1][1]}
    if (field[2][0] === field[1][1] && field[2][0] === field[0][2] && field[1][1] !== ' ') {return field[1][1]}
    return ' ';
}



