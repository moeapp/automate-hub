
let args = {
    "keywords":"",
    "wait":{"start":2,"end":4},
    "debug":true,
    "msgs":["Hello, 你好"],
    "max": 100,
    "username":"luopeng",
    "token":"1325be6b-5cd0-4653-9041-d1f53d5dc9e0",
    "server":"http://122.112.152.5",
    "onlyUnread": false,
}

// 权限判断, TODO
// - 由上层注入此逻辑
function audit() {
    // 检查是否具备次数
    let res;
    let str;
    let r;
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
        console.log(e);
        toast(e);
        sleep(2000);
        return false;
    }
}

// 是否在私信Tab
function isMessageTab() {
    // 检查是否存在私信
}

// 有新消息: 返回消息数量
// TabHost > FrameLayout > FrameLayout[1] > LinearLayout > FrameLayout[3]
function getMessageCount() {
    let tabhost = className("TabHost").findOne();
    // let tab = tabhost.children()[0];
    // let bar = tab.children()[tab.children().length - 1]; // 有些tab会中间多一个，一般都是2个，所以用这个方式来取
    // let items = bar.find(className("FrameLayout"));
    // let msg = items[4]; // 第3个消息 // TODO: 为什么是第4个没整明白

    let mt = tabhost.find(className("TextView")).filter((e) => e.text() == "消息").filter((e) => e.parent().className().indexOf("RelativeLayout") > 0)
    console.log("可能为消息的按钮有", mt.length, "个")
    if (mt.length === 0) return null
    let msg = mt[0].parent().parent().parent()

    let txts = msg.find(className("TextView"));

    return { element: msg, count: txts.length > 1 ? parseInt(txts[1].text() || 0) : 0 }
}

function xx(e, prefix) {
    console.log(prefix, e.id(), " - ", e.className())
    e.children().forEach(function(x) {
        xx(x, "=" + prefix)
    })
}

// 找到有新消息的私信
function findMessages() {

    let tabhost = className("TabHost").findOne();

    let container = tabhost.findOne(className("android.support.v7.widget.RecyclerView")); // ViewPager

    let items = container.children();

    let hasMore = !(items[items.length - 1].className().indexOf("FrameLayout") > 0
        && items[items.length - 1].children()[0].text() === "无更多消息");
    
    // 1. 过滤非个人私信
    let records = items.slice(0, items.length - (hasMore ? 0 : 1)).map(function(e) {
        let m = e.children()[1]; // 暱称和内容
        let t = e.children()[2]; // 时间和消息数

        // 更多，或者是第一个
        if (
            e.children().length !== 3 // 第一个会长度不是3
            || e.className().indexOf("LinearLayout") < 0 // 没有更多是FrameLayout
            || t.className().indexOf("LinearLayout") < 0 // 粉丝 | 互动 这些是 ImageView
        ) return null

        let mchild = m.children();
        let tchild = t.children();

        let countElement = tchild[1] && tchild[1].findOne(className("TextView"));

        // 需要处理异常和错误
        let msg = {
            element: e,
            count: countElement ? countElement.text() : 0,
            time: tchild[0].text(),
            nickname: mchild[0].children()[0].text(),
            content: mchild[1].findOne(className("TextView")).text(),
        }

        // 过滤官方的帐号
        if (msg.nickname === "抖音小助手") return null;
        if (msg.nickname === "系统消息") return null;

        return msg
    }).filter(function(e) {
        return e; 
    });

    return {
        hasMore: hasMore,
        records: records,
    }
}

// 读取消息内容
function parseMessages() {
    // 找到消息列表
    let container = className("android.support.v7.widget.RecyclerView").findOne();

    // 可能为消息的是, LinearLayout
    let msgs = container.children().map(function(e) {
        let items = e.children();

        let txt = items[1].findOne(className("TextView"));

        // - 有 1 个 LinearLayout
        // - 有 2 个 LinearLayout: time, content
        if (items.length === 3 && items[1].className().indexOf("LinearLayout") > 0) {
            return {
                content: txt && txt.text(),
            }
        }

        // - 有 1 个 LinearLayout 和 1 个 RelativeLayout, 自己发送的消息: time, content
        if (items.length === 3 && items[1].className().indexOf("RelativeLayout") > 0) {
            return {
                self: true,
                content: txt && txt.text(),
            }
        }

        // 目前其他应该不是消息
        return null;
    }).filter(function(e) {
        return e;
    })

    return msgs;
}

// 发送消息
function send({ msg, debug}) {
    let input = className("EditText").findOne();

    setText(msg);
    sleep(1000);

    // 找到发送按钮
    let sbtn = input.parent().parent().children()[3];
    if (!debug) sbtn.click();
    sleep(1000)
}

// 是否滑动到了底部
function isScrollEnd() {
    let txts = className("TextView").find();
    return txts[txts.length - 4] && txts[txts.length - 4].text().indexOf("无更多") >= 0
}

// 主要处理过程
function process({max, msgs, keywords, onlyUnread, debug}) {

    // 判断消息内容
    if (!msgs || msgs.length === 0) {
        toast("未设置发送内容");
        return;
    }

    // 默认最大次数
    max = 200;

    // 处理关键词
    keywords = keywords.split(',').filter((v) => v)

    // 确保在抖音中
    let curr = currentPackage();
    if (curr.indexOf("ugc.aweme") < 0) {
         toast("不在抖音程序内");
         return;
    }

    // 获取消息节点和当前具备的新消息数量
    let { element, count } = getMessageCount();

    toast("新消息有" + count + "条")
    sleep(2000);

    if (onlyUnread && count === 0) {
        toast("仅处理信息消息~");
        sleep(2000);
        return;
    }

    // 检查下是否获取成功
    if (!element) {
        console.log("查找消息节点失败");
        toast("查找消息节点失败~");
        sleep(1000);
        return;
    }

    // 切换到消息Tab
    element.click();
    sleep(1000);

    // 计数
    let totalCount = 0;

    // 记录评论发出去的人，防止重复发送
    let _sended = [];

    while (max > count) {
        // 查找消息列表
        let { hasMore, records } = findMessages();
    
        sleep(1000);
    
        records.forEach(function(e) {
            // 检查是否已经发送过了
            if (_sended.indexOf(e.nickname) >= 0) {
                // 在已发送列表
                console.log(e.nickname+"已经发送过了");
                return;
            }

            toast(e.nickname + " 有 "+e.count+" 条新消息");
            sleep(1000);

            // 判断是否达到限制
            if (!debug && !audit()) {
                toast("使用达到限制");
                sleep(1000);
                max = 0; // 需要终止整个循环
                // 返回列表
                return;
            }

            // 点击进去
            e.element.click();
            sleep(1000);

            // 读取出所有消息
            let rmsgs = parseMessages();

            if (rmsgs.length === 0) {
                toast("该用户未发送任何消息");
                console.log("该用户未发送任何消息");
                // 返回列表
                back();
                sleep(1000);
                return;
            }

            // 判断最后一条是不是自己
            if (rmsgs[rmsgs.length - 1].self) {
                toast("您已回复过~");
                console.log("您已回复过~");
                // 返回列表
                back();
                sleep(1000);
                return;
            }

            // 找出最后一条发过来的消息
            let rrmsgs = rmsgs.filter((e) => !e.self);
            if (rrmsgs.length === 0) {
                toast("没收到任何消息");
                console.log("没收到任何消息~");
                // 返回列表
                back();
                sleep(1000);
                return;
            }

            // 匹配消息内容判断是否需要发送消息
            let content = rrmsgs[rrmsgs.length - 1].content;
            if (!content) {
                toast("收到的消息不是文本消息");
                console.log("收到的消息不是文本消息~");
                // 返回列表
                back();
                sleep(1000);
                return;
            }

            // 过滤内容不符合关键词的
            let matched = true;
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
                toast("消息不匹配关键词");
                console.log("消息:", content, "不匹配关键词:", keywords);
                // 返回列表
                back();
                sleep(1000);
                return;
            }

            // 发送随机内容
            send({ msg: msgs[getRandomInt(msgs.length)], debug: debug });

            totalCount += 1;
            _sended.push(e.nickname);
            toast("第" + totalCount + "条消息发送成功" + (debug?" [DEBUG]": ""));
            console.log("第" + totalCount + "条消息发送成功" + (debug?" [DEBUG]": ""));
            sleep(2000);

            // 返回列表
            back();

            // 间隔的时间
            let _wait = args.wait.start + getRandomInt(args.wait.end - args.wait.start);
            toast("等待 "+_wait+"s 继续");
            sleep(_wait * 1000);
        });
    
        // 没有更多内容
        if (!hasMore) break;

        // 还有更多内容就向下滚动，向下滚动
        if (totalCount <= max ) {
            // 向下滚动屏幕
            let r = swipe(200, 1200, 430, 100, 1000);
            if (!r) {
                toast("向下滚动失败");
                console.log("向下滚动失败.")
                sleep(2000);
                break;
            }
            sleep(2000);
        }
    }

    toast("全部获取完成");
    sleep(1000);

    return;
}

// 获取随机整数
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// 入口函数
function main(_) {
    args = _;
    process(args);
}
