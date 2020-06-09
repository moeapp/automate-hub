
let args = {
    "keywords":"",
    "wait":{"start":2,"end":4},
    "debug":true,
    "msgs":["Hello, 你好"],
    "max": 100,
    "username":"zhouhui",
    "token":"b639cb16-1592-4490-91ce-ce38ce1e8bd7",
    "server":"http://122.112.152.5"
}

// 权限判断, TODO
// - 由上层注入此逻辑
function audit() {
    // 检查是否具备次数
    let res;
    let str;
    let r;

    let count = 0

    while (count < 3) {
        try {
            res = http.post(
                args["server"] + "/counter",
                {
                    username: args["username"],
                    token: args["token"]
                }
            );
            str = res.body.string();
            console.log(str);
            r = JSON.parse(str);
            if ( r.status === "200" ) return true;
            console.log(r.msg);
            toast(r.msg);
            sleep(2000);
        } catch(e) {
            console.log("第" + (count + 1) + "次请求失败" + e);
            toast("第" + (count + 1) + "次请求失败" + e);
            sleep(2000);
        }
        count += 1;
    }

    return false;
}

// 检查是否在目标程序内
function inapp() {
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

// TODO: 缓存!!!

// 评论按钮:
// - id ("a9l").find() a9w
// - 截图
// - 逻辑规则id
function findCommentButton() {

    toast("查询评论按钮~")

    let imgs = []

    let views = className("android.support.v4.view.ViewPager").find()

    let view = views.filter((e) => {
        let b = e.bounds()
        console.log(e.id(), e.className(), b.left, b.right, b.top, b.bottom)
        return b.right > 0
    })[0]

    if (view) console.log("==> 找到 ViewPager =>", view.id())
    // 找出所有的图片
    if (view) imgs = view.find(className("ImageView").descContains("评论"))

    console.log("一共找到" + imgs.length + "评论按钮")
    return imgs.length === 3 ? imgs[1].parent() : imgs[0].parent()

    // 原来的逻辑 不好用

    let countRegex = /^\d+(\.\d+)?[wk]?$/;

    // 找出所有的textview，并用数量的正则过滤
    let btns = className("TextView").find().filter(function(e) {
        return countRegex.test(e.text())
    });

    // 找出评论的按钮:
    // 0 1 2, 3 4 5
    // 0 1 2, 3 4 5, 5 7 8
    toast("查询评论按钮~"+btns.length);
    btns.forEach((e) => {
        console.log("==>", e.text(), e.desc(), e.className(), e.id())
    })

    switch (btns.length) {
        case 6:  // 最后一个视频判断不了
            return btns[1];
        case 9:
            return btns[4];
        default:
            return null;
    }
}

// 是否在评论列表页
function isCommentList() {
    let regex = /^\d+(\.\d+)?[wk]? 条评论/
    let tmp = className("TextView").find().filter(function(e) {
        return regex.test(e.text())
    });

    return tmp.length === 1;
}


function xx(e, prefix) {
    console.log(prefix, e.id(), " - ", e.className(), "-", e.text())
    e.children().forEach(function(x) {
        xx(x, "=" + prefix)
    })
}

// 查找所有评论
// - id adc
// - 布局逻辑 LinearLayout
function findComments() {

    let views = className("android.support.v7.widget.RecyclerView").find().filter((e) => e.bounds().left === 0)
    let container = views[0]

    let comments = container.children().filter((e) => e.children().length === 1 && e.children()[0].className().indexOf("ViewGroup") > 0)
    // let comments = container.find(className("ViewGroup")).map((e) => {
    //     console.log("ViewGroup", e.id(), e.className())
    //     return e.parent()
    // })

    console.log("评论列表", container.id(), "大概数量:", comments.length)

    xx(container, "=>")

    return comments;
}

// 解析评论， 返回作者和内容
// 第 0 个 child(ViewGroup)
function parseComment(e) {
    let txts = e.find(className("TextView"));

    if (txts.length<2) {
        // TODO: 为什么失败
        console.log("解析评论失败~");
        return null;
    }

    return {
        author: txts[0].text(),
        comment: txts[1].text(),
        count: txts.length>2?txts[2].text():0,
    }
}

// 是否滑动到了底部
function isScrollEnd() {
    let txts = className("TextView").find();
    return txts[txts.length - 4] && txts[txts.length - 4].text().indexOf("没有更多") >= 0
}

// 主要处理过程
function process({max, msgs, keywords, debug}) {

    // 判断消息内容
    if (!msgs || msgs.length === 0) {
        toast("未设置发送内容");
        return;
    }

    // 默认最大次数
    if (!max) max = 200;

    // 处理关键词
    keywords = keywords.split(',').filter((v) => v)

    // 确保在抖音中
    let curr = currentPackage();
    if (curr.indexOf("ugc.aweme") < 0) {
         toast("不在抖音程序内");
         return;
    }

    // 如果不在评论列表页，点击按钮
    if (!isCommentList()) {
        let commentBtn = findCommentButton();
        if (!commentBtn) {
            toast("查找评论按钮失败~");
            return;
        }

        // 点击评论按钮
        commentBtn.click();
        sleep(2000);
    }


    // 计数
    let count = 0;

    // 记录评论发出去的人，防止重复发送
    let _sended = [];

    // 一直滚动屏幕， 一旦到达就退出
    while(max > count) {

        // 找到所有评论
        let cmt = findComments();

        toast("共:" + cmt.length + "个评论")
        console.log("共:" + cmt.length + "个评论")

        for (let i=0; i<cmt.length; i++) {
            let item = cmt[i];

            if (count >= max) {
                console.log("发送数量达总量:"+count);
                break;
            }

            // 解析出作者和评论内容
            let x = parseComment(item)
            if (!x) {
                toast("评论解析错误~");
                continue
            }

            let { author, comment } = x

            console.log(author + "说:" + comment)

            // 检查是否已经发送过了
            if (_sended.indexOf(author) >= 0) {
                // 在已发送列表
                console.log(author+"已经发送过了");
                continue
            } else {
                // 一旦发现不在就可以清空了, 不清理
                // _sended = [];
            }

            // 判断是否达到限制
            if (!debug && !audit()) {
                max = 0; // 需要终止整个循环
                return;
            }

            // 加入已发送列表
            _sended.push(author);

            let matched = true;

            console.log("检查关键词:" + keywords)
            // 过滤内容不符合关键词的
            if (keywords && keywords.length > 0) {
                matched = false;
                // 或的关系
                for (let i = 0; i < keywords.length; i ++) {
                    // 有任意一个符合条件就可以去发送
                    matched = comment.indexOf(keywords[i]) > 0;
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

        if (count < max ) {

            // TODO: 滚动到达底部判断
            if (isScrollEnd()) {
                console.log("已经划到了底部~")
                toast("已经划到了底部~")
                sleep(2000);
                break;
            }

            // 向下滚动屏幕
            let r = swipe(200, 1200, 430, 100, 1000);
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

// 获取随机整数
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// 发送消息
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

// 入口函数
function main(_) {
    args = _;
    process(args);
}

main(args)