var cubeSize = [50, 50];

var shapes = [
    // X
    //XOX
    [[0, -1], [-1, 0], [0, 0], [1, 0]],
    //XO
    // XX
    [[-1, 0], [0, 0], [0, 1], [1, 1]],
    //XOX
    //  X
    [[-1, 0], [0, 0], [1, 0], [1, 1]],
    //XX
    //XO
    [[-1, -1], [0, -1], [-1, 0], [0, 0]],
    //XXOX
    [[-2, 0], [-1, 0], [0, 0], [1, 0]],
]

var mapSize = [10, 10];

var RussianBox = {
    createNew: function(typeId){
        var box = {
            shape: shapes[typeId],
            position: [mapSize[0]/2, 0],
        };
        box.cube = new Array(box.shape.length);
        box.rotate = function(){
            for (var i = 0; i < box.shape.length; i++) {
                //(x,y)->(y,-x)
                var x = box.shape[i][0];
                var y = box.shape[i][1];
                box.shape[i][0] = y;
                box.shape[i][1] = -x;
            }
        }
        box.goDown = function(){
            box.position[1]++;
        }
        box.goLeft = function(){
            box.position[0]--;
        }
        box.goRight = function(){
            box.position[0]++;
        }
        return box;
    }
}

var Logic = {
    currentPressedKey: 0,
    map: {},
    initMap: function(){
        this.map = new Array(mapSize[1]);
        for (var i = 0; i < mapSize[1]; i++) {
            this.map[i] = new Array(mapSize[0]);
            for (var j = 0; j < mapSize[0]; j++) {
                this.map[i][j] = 0;
            }
        }
    },
    initListener: function(){
        key = this.currentPressedKey;
        window.onkeydown = function (e) {
            var code = e.keyCode ? e.keyCode : e.which;
            if (code>=37 && code<=40) {
                Logic.currentPressedKey = code;
            }
        };
    },
    checkIfCanGoLeft: function(box){
        for (var i = 0; i < box.shape.length; i++) {
            var x = box.shape[i][0]+box.position[0]-1;
            var y = box.shape[i][1]+box.position[1];
            if (x<0 || this.map[y][x]===1) {
                return false;
            }
        }
        return true;
    },
    checkIfCanGoRight: function(box){
        for (var i = 0; i < box.shape.length; i++) {
            var x = box.shape[i][0]+box.position[0]+1;
            var y = box.shape[i][1]+box.position[1];
            if (x>=mapSize[0] || this.map[y][x]===1) {
                return false;
            }
        }
        return true;
    },
    checkIfDownToFloor: function(box){
        for (var i = 0; i < box.shape.length; i++) {
            var x = box.shape[i][0]+box.position[0];
            var y = box.shape[i][1]+box.position[1]+1;
            if (y>=mapSize[1] || this.map[y][x]===1) {
                return true;
            }
        }
        return false;
    },
    updateMap: function(box){
        for (var i = 0; i < box.shape.length; i++) {
            var x = box.shape[i][0]+box.position[0];
            var y = box.shape[i][1]+box.position[1];
            if ((x>=0 && x<mapSize[0]) && (y>=0 && y<mapSize[1])) {
                this.map[y][x] = 1;
            }            
        }
    },
    UpdatePosition: function(box){
        switch(this.currentPressedKey) {
            case 37://left
                if (this.checkIfCanGoLeft(box)) {
                    box.goLeft();
                }
                break;
            case 38://up
                box.rotate();
                break;
            case 39://right
                if (this.checkIfCanGoRight(box)) {
                    box.goRight();
                }
                break;
            case 40://down
                console.log(this.checkIfDownToFloor(box));
                if (!this.checkIfDownToFloor(box)) {
                    box.goDown();
                }
                break;
        }
        this.currentPressedKey = 0;
    },
    checkIfCanDelete: function(socket){
        var moveTo = new Array(mapSize[1]);
        var deletedNum = 0;
        for (var i = mapSize[1]-1; i >= 0; i--) {
            var full = 1;
            for (var j = 0; j < mapSize[0] ; j++) {
                if (this.map[i][j]!=1) {
                    full = 0;
                }
            }
            if (full === 1) {
                deletedNum++;
                console.log("delete");
                moveTo[i] = -1;
            }
            else {
                moveTo[i] = i+deletedNum;
            }
        }
        for (var i = mapSize[1]-1; i >= 0; i--) {
            if (moveTo[i] >= 0) {
                for (var j = 0; j < mapSize[0] ; j++) {
                    this.map[moveTo[i]][j] = this.map[i][j];
                }
            }
        }
        if (deletedNum > 0) {
            socket.emit('delete', deletedNum);
        }
    }
}

var Renderer = {
    board: {},
    init: function(){
        this.board = new Array(mapSize[1]);
        for (var i = 0; i < mapSize[1]; i++) {
            this.board[i] = new Array(mapSize[0]);
            for (var j = 0; j < mapSize[0]; j++) {
                this.board[i][j] = document.createElement("div");
                this.board[i][j].className = "block";
                this.board[i][j].style.webkitTransform = "translateX("+(j*cubeSize[0])+"px) translateY("+(i*cubeSize[1])+"px)";
                this.board[i][j].style.visibility = "hidden";
                document.getElementById("game-container").appendChild(this.board[i][j]);
            }
        }
    },
    render: function(box, map){
        for (var i = mapSize[1]-1; i >= 0; i--) {
            for (var j = 0; j < mapSize[0] ; j++) {
                if (map[i][j] === 1) {
                    this.board[i][j].style.visibility = "visible";
                }
                else {
                    this.board[i][j].style.visibility = "hidden";
                } 
            }
        }
        for (var i = 0; i < box.shape.length; i++) {
            var x = box.shape[i][0]+box.position[0];
            var y = box.shape[i][1]+box.position[1];
            if ((x>=0 && x<mapSize[0]) && (y>=0 && y<mapSize[1])) {
                this.board[y][x].style.visibility = "visible";
            }
        }
    }
}

var Game = {
    box: {},
    socket: {},
    ifDownToFloor: false,
    init: function() {
        this.socket = io();
        this.box = RussianBox.createNew(Math.floor((Math.random()*5)));
        Logic.initMap();
        Logic.initListener();
        Renderer.init();
    },
    update: function() {
        Logic.UpdatePosition(this.box);
        if (Logic.checkIfDownToFloor(this.box)) {
            this.ifDownToFloor = true
        }
    },
    drop: function() {
        if (this.ifDownToFloor) {
            Logic.updateMap(this.box);
            Logic.checkIfCanDelete(this.socket);
            Game.box = RussianBox.createNew(Math.floor((Math.random()*5)));
            this.ifDownToFloor = false;
        }
        if (Logic.checkIfDownToFloor(this.box)) {
            this.ifDownToFloor = true;
        }
        else {
            this.box.goDown();
        }
    },
    render: function() {
        Renderer.render(this.box, Logic.map);
    }
}

function onLoad() {
    Game.init();
    setInterval(function(){
        Game.update();
        Game.render();
    },100);
    setInterval(function(){
        Game.drop();
        Game.render();
    },1000);
}

