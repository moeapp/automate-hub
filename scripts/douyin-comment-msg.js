
let args = {
    "keywords":"",
    "wait":{"start":25.0,"end":75.0},
    "debug":true,
    "msgs":["Hello, 你好"],
    "username":"zhouhui",
    "token":"b639cb16-1592-4490-91ce-ce38ce1e8bd7",
    "server":"http://www.hzjx.tech"
}

// 需要优化
function audit() {
    // 检查是否具备次数
    let res;
    let r;
    try {
        res = http.post(args["server"] + "/" + "/counter", {username: args["username"], "password": args["password"]});
        let r = JSON.parse(res.body.string());
        if ( r.status === "200" ) return true;
    } catch(e) {
        toast(res.body.string());
        sleep(1000);
        return false;
    }
    toast(r.msg);
    sleep(1000);
}

function main(_) {
    args = _;
    process(args);
}

// 检查是否在目标程序内
function inApp() {
    // 检查当前包名
    let curr = currentPackage();

    if (curr.indexOf("ugc.aweme") < 0) {
        toast("不在抖音程序内");
    } else {
        // 启动程序
        // launchApp('抖音短视频');
        // sleep(5000);
    }
}

// 主要处理过程
function process({max, msgs, keywords, debug}) {

    max = 200;

    keywords = keywords.split(',').filter((v) => v)

    if (!msgs || msgs.length === 0) {
        toast("未设置发送内容");
        return;
    }

    // 确保在抖音中
    let curr = currentPackage();
    if (curr.indexOf("ugc.aweme") < 0) {
         toast("不在抖音程序内");
         return;
     }

    // 点击评论按钮, 没有就算了, 这里需要指定的版本, a9w
    let btns = id("a9l").find()
    btns[btns.length===2?0:1].click() // 最后一个视频判断不了
    sleep(2000);


    let count = 0;

    // 记录评论发出去的人，防止重复发送
    let _sended = [];

    // 一直滚动屏幕， 一旦到达就退出
    while(max > count) {

        // 找到所有
        // 滚动常按评论, adc, 这里需要指定的版本,
        let cmt = id("adc").find();

        toast("共:" + cmt.length + "个评论")
        console.log("共:" + cmt.length + "个评论")

        for (let i=0; i<cmt.length; i++) {
            let item = cmt[i];
            console.log("=>" + item.id())

            if (item.parent() && item.parent().id().indexOf("e6o") < 0) {
                // 过滤其他的,由于高精度导致的错误
                console.log("parent =>" + item.parent().id())
                continue
            }

            if (count >= max) {
                console.log("发送数量达总量:"+count);
                break;
            }

            // sleep(2000);

            // 自己级别评论卡住

            // 过滤暱称已经在发送列表中的
            // console.log("查找作者和消息内容...")
            let author = item.children().findOne(id("title")); // 找到暱称
            let content = item.children().findOne(id("a2o")); // 找到回复的文本
            // console.log("查找完成")


            if (!author || !content) {
                toast("作者或内容为空." + item.text());
                console.log("作者或内容为空.")
                continue
            }


            author = author.text();
            content = content.text();

            console.log(author + "说:" + content)

            if (_sended.indexOf(author) > 0) {
                // 在已发送列表
                console.log(author+"已经发送过了");
                continue
            } else {
                // 一旦发现不在就可以清空了, 不清理
                // _sended = [];
            }

            // 判断是否达到限制
            if (!audit()) {
                toast("使用达到限制");
                return;
            }

            // 加入已发送列表
            _sended.push(author);

            let matched = true;

            console.log("检查关键词:"+keywords)
            // 过滤内容不符合关键词的
            if (keywords && keywords.length > 0) {
                matched = false;
                // 或的关系
                for (let i = 0; i < keywords.length; i ++) {
                    // 有任意一个符合条件就可以去发送
                    matched = content.indexOf(keywords[i]) > 0;
                    if (matched) break;
                }
            }

            if (!matched) {
                toast("内容不匹配:"+keywords);
                console.log("内容不匹配:"+ keywords)
                continue;
            }

            // 发送消息
            console.log("常按评论内容,进行私信流程")
            item.longClick();
            sleep(2000);

            // 随机生成消息
            send({msg: msgs[getRandomInt(msgs.length)], debug: debug});

            count += 1;
            toast("第" + count + "条消息发送成功" + (debug?" [DEBUG]": ""));
            console.log("第" + count + "条消息发送成功" + (debug?" [DEBUG]": ""));

            // 间隔的时间
            let _wait = args.wait.start + getRandomInt(args.wait.end - args.wait.start);
            toast("等待 "+_wait+"s 继续");
            sleep(_wait * 1000);
        }

        if (count <= max ) {
            // 向下滚动屏幕
            let r = swipe(200, 1000, 430, 300, 1000);
            if (!r) {
                toast("向下滚动失败");
                console.log("向下滚动失败.")
                sleep(2000);
                break;
            }
        }

    }

    toast("执行完成");
    console.log("执行完成.")
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function send({msg, debug}) {
    // 查找 私信回复,并点击
    text("私信回复").findOne().click();
    sleep(2000);


    // 输入框放入内容
    setText(msg);
    sleep(2000);

    // 点击确认按钮: 调试时点击取消按钮
    if (debug) {
        text("取消").findOne().click();
        return true;
        // toast("[DEBUG]消息发送成功");
    } else {
        text("发送").findOne().click();
        return true;
        // toast("消息发送成功");
    }
}