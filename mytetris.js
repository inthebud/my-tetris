//方块每次移动的距离
var STEP = 40;
//将容器规定为18行，10列
var ROW_COUNT = 18,
    COL_COUNT = 10;

//每个方块模型在4*4十六宫格中的坐标
var MODELS = [
    //形状L
    {
        0:{
            row:2,
            col:0
        },
        1:{
            row:2,
            col:1
        },
        2:{
            row:2,
            col:2
        },
        3:{
            row:1,
            col:2
        }
    },
    //形状J
    {
        0:{
            row:2,
            col:1
        },
        1:{
            row:2,
            col:2
        },
        2:{
            row:1,
            col:2
        },
        3:{
            row:0,
            col:2
        }
    },
    //形状‘凸’
    {
        0:{
            row:1,
            col:1
        },
        1:{
            row:0,
            col:0
        },
        2:{
            row:1,
            col:0
        },
        3:{
            row:2,
            col:0
        }
    },
    //形状‘田’
    {
        0:{
            row:1,
            col:1
        },
        1:{
            row:2,
            col:1
        },
        2:{
            row:1,
            col:2
        },
        3:{
            row:2,
            col:2
        }
    },
    //形状‘一’
    {
        0:{
            row:0,
            col:0
        },
        1:{
            row:0,
            col:1
        },
        2:{
            row:0,
            col:2
        },
        3:{
            row:0,
            col:3
        }
    },
    //形状‘Z’
    {
        0:{
            row:1,
            col:1
        },
        1:{
            row:1,
            col:2
        },
        2:{
            row:2,
            col:2
        },
        3:{
            row:2,
            col:3
        }
    },
    //形状反‘Z’
    {
        0:{
            row:2,
            col:1
        },
        1:{
            row:2,
            col:2
        },
        2:{
            row:1,
            col:2
        },
        3:{
            row:1,
            col:3
        }
    }
];

//当前使用模型与十六宫格坐标
var currentModel = {},
    currentX = 0,
    currentY = 0;

//是否已在游戏中
var gaming = false;

//当前得分
var current_score = 0;

//历史最高分
var topScore = 0;

//定时器变量
var mInterval = null;

//记录所有块元素位置
//key=行_列  ：value = 块元素
var fixedBlocks = {};

function init(){
    getTopScore();
}

function getTopScore(){
    if(localStorage.getItem('TOP_SCORE')){
        topScore = localStorage.getItem('TOP_SCORE');
        document.getElementsByClassName('top_score')[0].innerHTML = '最高得分：'+topScore;
    }else{
        document.getElementsByClassName('top_score')[0].innerHTML = '最高得分：0'
    }
}

//开始游戏
function begin(){
    if(gaming){
        alert('已在游戏中')
    }else{
        //更改游戏状态
        gaming = true;
        //初始化当前分数
        current_score = 0;
        document.getElementsByClassName('score')[0].innerHTML="当前得分："+current_score;
        //清除上一局所有块元素
        clearEles();
        //根据模型数据创建对应块元素
        createModel();
        //监听用户键盘事件
        onKeyDown();
    }
}

function onKeyDown(){
    document.onkeydown = function(event){
        switch(event.keyCode){
            case 38:
            //旋转模型
                rotate();
                break;
            case 39:
                move(1,0);
                break;
            case 40:
                move(0,1);
                break;
            case 37:
                move(-1,0);
                break;
        }
    }
}

function rotate(){
    //旋转后的行 = 旋转前的列
    //先转后的列 = 3 - 旋转前的行

    //用lodash里面的方法克隆以下currentModel
    //cloneCurrentModel数据改变不会影响currentModel
    var cloneCurrentModel = _.cloneDeep(currentModel);
    for (var key in cloneCurrentModel){
        var blockModel = cloneCurrentModel[key];
        var temp = blockModel.row;
        blockModel.row = blockModel.col;
        blockModel.col = 3-temp;
    }
    //若将要旋转的位置不存在已固定块元素，则接受这次旋转
    currentModel = cloneCurrentModel;
    locationBlocks();
}

function createModel() {
    //判断游戏是否结束
    if(isGameOver()){
        //结束游戏
        gameOver();
        return;
    }
    //如果游戏没结束，随机取对象模型创建方块
    currentModel = MODELS[Math.floor(Math.random()*MODELS.length)];
    for (var key in currentModel){
        var divEle = document.createElement('div');
        divEle.className = 'activity_model';
        document.getElementById('container').appendChild(divEle);
    }
    //定位方块
    currentX = 3;
    currentY = 0;
    locationBlocks();

    //判断创建的方块是否与已有方块重叠
    if (isMeet(3,0,currentModel)){
        //结束游戏
        gameOver();
        return;
    }
    //让模型自动下落
    autoDown();
}

function autoDown() {
    if (mInterval){
        clearInterval(mInterval);
    }

    mInterval=setInterval(function(){
        //移动方块
        move(0,1);
    },600)
}

function move(x,y){
    //判断底部是否会发生碰触
    //x,y表示当前模型十六宫格将要移动的位置
    //model 表示当前模型数据将要完成的变化
    if (isMeet(currentX+x,currentY+y,currentModel)){
        //底部已碰触时再按下键使方块模型固定
        if (y!==0){
            fixedBottomModel();
        }
        return;
    }
    //没碰触时控制十六宫格移动
    currentX += x;
    currentY += y;
    locationBlocks();
}

function isMeet(x,y,model){
    //当某一位置已存在被固定的块元素，那么活动中的模型不可以再占用该位置
    //判断活动模型将要移动到的位置是否有固定块元素
    for (var k in model){
        var blockModel = model[k];
        if (fixedBlocks[(y+blockModel.row)+'_'+(x+blockModel.col)]){
            return true;
        }
    }
    return false;
}
function locationBlocks(){
    //判断当前位置是否越界
    checkBound();
    //获取所有块元素
    var eles = document.getElementsByClassName('activity_model');
    for (var i = 0; i<eles.length;i++){
        var activityModelEle = eles[i];
        //找到每个块元素对应数据（行，列）
        var blockModel = currentModel[i];
        //根据数据指定块元素位置(每个块元素未至由十六宫格位置，与块元素在十六宫格中的位置决定)
        activityModelEle.style.top = (currentY+blockModel.row)*STEP + 'px';
        activityModelEle.style.left = (currentX+blockModel.col)*STEP + 'px';
    }
}

function checkBound(){
    //定义模型可以活动的边界
    var leftBound = 0;
    //当模型中块元素超出边界后，让十六宫格后退
    for (var key in currentModel){
        var blockModel = currentModel[key];
        if (blockModel.col + currentX <leftBound){
            currentX++;
        }
        if (blockModel.col+currentX>=COL_COUNT){
            currentX--;
        }
        //若超过下边界把模型固定在底部
        if (blockModel.row+currentY>=ROW_COUNT){
            currentY--;
            fixedBottomModel();
        }
    }
}

function fixedBottomModel(){

    //让模型不再移动
    var activityModelEles = document.getElementsByClassName('activity_model');
    //获取每个块元素(从后往前遍历)
    for (var i = activityModelEles.length-1;i>=0;i--){
        var activityModelEle = activityModelEles[i];
        //改变模型class名使块元素样式改变
        activityModelEle.className = 'fixed_model';
        //记录该块元素位置
        var blockModel = currentModel[i];
        fixedBlocks[(currentY+blockModel.row)+'_'+(currentX+blockModel.col)]= activityModelEle;
    }
    //判断一行是否有铺满行需清除
    isRemoveLine();
    //创建新的方块
    createModel();
}

function isRemoveLine(){
    //如果一行中每一列都存在块元素，那么清理该行
    //遍历所有行中的所有列
    for (var i = 0 ; i<ROW_COUNT;i++){
        //添加标记符，假设当前行已被铺满
        var flag = true;
        for (var j = 0;j<COL_COUNT;j++){
            //如果当前行中有一列没有数据，说明没被铺满,结束遍历
            if(!fixedBlocks[i+'_'+j]){
                flag = false;
                break;
            }
        }
        //如果有一行被铺满
        if (flag){
            //清理该行
            removeLine(i);
            //当前得分加一
            current_score++;
            changeScore(current_score);
        }
    }
}

function changeScore(score){
    document.getElementsByClassName('score')[0].innerHTML='当前得分：'+score;
}

function removeLine(line){
    //遍历该行中所有列
    for (var i = 0;i<COL_COUNT;i++){
        //删除该行中所有块元素
        document.getElementById('container').removeChild(fixedBlocks[line+'_'+i]);
        //删除该行中所有块元素数据源
        fixedBlocks[line+'_'+i]=null;
    }
    //让被清理行之上的行下落
    downLine(line);
}

function downLine(line){
    //遍历被清理行之上的所有行的所有列
    for (var i=line-1;i>0;i--){
        for (var j = 0;j<COL_COUNT;j++){
            //如果不存在数据
            if(!fixedBlocks[i+'_'+j])continue;
            //如果存在数据,被清理行之上的所有块元素数据源行数+1
            fixedBlocks[(i+1)+'_'+j]=fixedBlocks[i+'_'+j];
            //让块元素在容器中的位置下落
            fixedBlocks[(i+1)+'_'+j].style.top=(i+1)*STEP+'px';
            //清理掉之前的块元素
            fixedBlocks[i+'_'+j]=null;
        }
    }
}

function gameOver(){
    // 清除计时器
    if (mInterval){
        clearInterval(mInterval);
    }
    alert('游戏结束，您本次得分为：'+ current_score);
    //检查更改最高分
    changeTopScore(current_score);
    gaming=false;
}

function changeTopScore(score){
    if (score>topScore){
        localStorage.setItem('TOP_SCORE',score);
        document.getElementsByClassName('top_score')[0].innerHTML=
            '最高得分：'+ localStorage.getItem('TOP_SCORE');
    }
}

function isGameOver(){
    //当第0行存在块元素时，游戏结束
    for (var i = 0;i<COL_COUNT;i++){
        if(fixedBlocks[0+'_'+i]){
            return true;
        }
    }
    return false;
}

function clearEles(){
    var willDelete = document.getElementsByClassName('fixed_model');
    for(var i = willDelete.length-1;i>=0; i--){
        document.getElementById('container').removeChild(willDelete[i]);
    }
    fixedBlocks = {};
}

//重置游戏最高分
function reset(){
    localStorage.setItem('TOP_SCORE',0);
    document.getElementsByClassName('top_score')[0].innerHTML =
        '最高得分：'+ localStorage.getItem('TOP_SCORE');
}
