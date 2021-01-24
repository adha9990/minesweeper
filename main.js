// 主物件
var game = {
    play:false,
    size:{
        width:0,
        height:0,
    },
    //被開啟的區塊數
    open_count:0,
    //地雷數量
    mines_count:0,
    mines:[],
    map:[],
    flash:[],
    time:null,
    user:{
        level:"normal",
        time:0,
    },
    // 初始化
    init(){
        this.play = false;
        this.open_count = 0;
        this.mines = [];
        this.map = [];
        switch (this.user.level) {
            case "easy":
                this.size.width = 10;
                this.size.height = 8;
                this.mines_count = 10;
                $("table").css({'font-size':'50px'});
                $("#flag").text(10);
                break;
            case "normal":
                this.size.width = 18;
                this.size.height = 14;
                this.mines_count = 40;
                $("table").css({'font-size':'30px'});
                $("#flag").text(40);
                break;
            case "hard":
                this.size.width = 24;
                this.size.height = 20;
                this.mines_count = 100;
                $("table").css({'font-size':'20px'});
                $("#flag").text(100);
                break;
            default:
                break;
        }
        this.setMap();
        this.drawTable();
        $("#time").text(0);
        $("#flag").text();
    },
    // 設定陣列
    setMap(){
        for(let x = 0;x<this.size.width;x++){
            let tr = [];
            for(let y = 0;y<this.size.height;y++){
                tr.push(new mines(x,y));
            }
            this.map.push(tr);
        }
    },
    // 隨機地雷
    random_mines(nx,ny){
        //列陣列放置每一點座標
        let map = [];
        for(let x = 0;x<this.size.width;x++){
            for(let y = 0;y<this.size.height;y++){
                //當前點擊的方塊及周圍 2 格內不能有炸彈
                let check = false;
                let around = 2;
                for(let xx=-around;xx<around+1;xx++){
                    for(let yy=-around;yy<around+1;yy++){
                        if(x == nx+xx && y == ny+yy) check = true;
                    }
                }
                if(check) continue;
                map.push({x:x,y:y})
            }
        }
        //用陣列隨機抓座標避免重複
        for(let i = 0;i<this.mines_count;i++){
            let new_count = map.length;
            if(new_count < 1) return;
            let n = Math.floor(new_count * Math.random());
            let mines = map.splice(n,1)[0];
            this.mines.push(mines);
            this.map[mines.x][mines.y].is_mines = true;
        }
    },
    // 點擊事件
    check_mines(x,y){
        let mines = this.map[x][y];
        if(mines.is_flag) return;
        if(mines.is_open) return;
        if(mines.is_flag) return;
        //是否為第一次執行
        if(!this.play){
            this.init();
            this.play = true;
            this.random_mines(x,y);
            this.time = setInterval(()=>$("#time").text($("#time").text()*1+1),1000);
        }
        //是否踩到炸彈
        if(mines.is_mines){
            this.play = false;
            this.bang(x,y);
        }else{
            this.prompt(x,y);
        }
        //檢查是否只剩炸彈
        this.check_win();
    },
    // 檢查並提示周圍炸彈數
    prompt(x,y){
        //周圍炸彈數
        let count = 0;
        for(let yy = y-1;yy <= y+1;yy++){
            if(yy < 0 || yy >= this.size.height) continue;
            for(let xx = x-1;xx <= x+1;xx++){
                if(xx < 0 || xx >= this.size.width) continue;
                if(yy == y && xx == x) continue;
                if(this.map[xx][yy].is_mines){
                    count++;
                }
            }
        }
        //當前區塊設定
        this.open_count++;
        let mines = this.map[x][y];
        mines.is_open = true;
        mines.around_mines = count;
        mines.draw();
        //周圍是否有炸彈
        if(count){
            $(`#mines_x${x}_y${y}`).text(count);
        }else{
            //接著開圖直到開出周圍有炸彈
            for(let xx=-1;xx<1+1;xx++){
                for(let yy = -1;yy<1+1;yy++){
                    let nx = x+xx;
                    let ny = y+yy;
                    //檢查下一步是否超出範圍或已經搜過
                    if(ny < 0 || ny >= this.size.height) continue;
                    if(nx < 0 || nx >= this.size.width) continue;
                    if(this.map[nx][ny].is_open) continue;
                    this.prompt(nx,ny);
                }
            }
        }
    },
    //插旗
    flag(x,y){
        let mines = this.map[x][y];
        if(!this.play) return;
        if(mines.is_open) return;
        mines.is_flag = !mines.is_flag;
        if(mines.is_flag){
            $("#flag").text($("#flag").text()*1-1);
            $(`#mines_x${x}_y${y}`).addClass("flag");
        }else{
            $("#flag").text($("#flag").text()*1+1);
            $(`#mines_x${x}_y${y}`).removeClass("flag");
        }
    },
    //已開啟空格右鍵事件
    check_around(x,y){
        let mines = this.map[x][y];
        let count = 0;
        //預開通空格存放區
        let pre_mines = [];
        //如果周圍插旗數==周圍炸彈數,開通四周空格
        for(let yy = -1;yy<2;yy++){
            for(let xx = -1;xx<2;xx++){
                let ny = y+yy;
                let nx = x+xx;
                if(ny < 0 || ny >= this.size.height) continue;
                if(nx < 0 || nx >= this.size.width) continue;
                let now = this.map[nx][ny];
                if(now.is_flag){
                    count++;
                }else{
                    if(!now.is_open){
                        pre_mines.push(now);
                    }
                }
            }
        }
        if(mines.around_mines == count){
            //四周空格全開
            pre_mines.forEach((mines)=>{
                this.check_mines(mines.x,mines.y);
            });
        }else{
            //附近炸彈數==沒開過的空格+插旗子的空格，自動幫你插旗未開通空格，這功能笑死
            //if(mines.around_mines == count + pre_mines.length){pre_mines.forEach((mines)=>this.flag(mines.x,mines.y));return;}
            //提示未開部分
            pre_mines.forEach((mines)=>{
                let now_mines = this.map[mines.x][mines.y];
                this.flash.push(now_mines);
                now_mines.toggle_flash(true);
            });
        }
    },
    // 建立介面
    drawTable(){
        $("#game-table tr").remove();
        for(let y = 0;y<this.size.height;y++){
            let tr = $("<tr>");
            for(let x = 0;x<this.size.width;x++){
                let td = $(`<td id='mines_x${x}_y${y}'>`)
                .addClass("border border-secondary")
                .addClass(((x+y) % 2)?"a":"b")
                //滑鼠事件
                .click(()=>this.check_mines(x,y))
                .mousedown((e)=>{
                    if(e.which == 3){
                        let mines = this.map[x][y];
                        if(mines.is_open && mines.around_mines != 0){
                            this.check_around(x,y);
                        }else{
                            this.flag(x,y);
                        }
                    }
                })
                .mouseup((e)=>{
                    if(e.which == 3){
                        this.flash.forEach((mines)=>mines.toggle_flash(false));
                    }
                })
                //防止跳出選單列
                .contextmenu(()=>false);
                let grd_width = Math.ceil($("#game-table").width() / this.size.width);
                td.height(grd_width);
                tr.append(td);
            }
            $("#game-table").append(tr);
        }
    },
    //是否已經贏了
    check_win(){
        let open_count = this.open_count;
        let mines_count = this.mines_count;
        let grass_count = this.size.width * this.size.height;
        if(open_count >= grass_count - mines_count){
            setTimeout(()=>{
                alert("You are the winner !!!");
                this.init();
            },100);
            clearInterval(this.time);
        }
    },
    //顯示全部炸彈
    bang(){
        this.mines.forEach((pos)=>{
            let x = pos.x;
            let y = pos.y;
            $(`#mines_x${x}_y${y}`).text("*");
        });
        setTimeout(()=>{
            $("#model").modal('show');
        },100);
        clearInterval(this.time);
    },
}
//地雷物件
class mines{
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.is_mines = false;
        this.is_flag = false;
        this.is_open = false;
        this.around_mines = null;
    }
    draw(){
        let x = this.x;
        let y = this.y;
        if((x+y) % 2){
            $(`#mines_x${x}_y${y}`).removeClass("a").addClass("a2");
        }else{
            $(`#mines_x${x}_y${y}`).removeClass("b").addClass("b2");
        }
        $(`#mines_x${x}_y${y}`).addClass(`m${this.around_mines}`);
    }
    toggle_flash(check){
        let x = this.x;
        let y = this.y;
        if(check){
            $(`#mines_x${x}_y${y}`).addClass("flash");
        }else{
            $(`#mines_x${x}_y${y}`).removeClass(`flash`);
        }
    }
}
