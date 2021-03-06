
let args = {
    "keywords":"",
    "wait":{"start":2,"end":4},
    "debug":true,
    "msgs":["Hello, 你好"],
    "max": 2, // 最大发送次数
    "max_continue": true, // 达到最大次数是否继续
    "max_wait_for": 2, // 达到最大次数等待时间
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

// 是否在私信Tab
function isMessageTab() {
    // 检查是否存在私信
}

// Tab栏的高度

// 有新消息: 返回消息数量
// TabHost > FrameLayout > FrameLayout[1] > LinearLayout > FrameLayout[3]
function getMessageCount() {
    let tabhost = className("TabHost").findOne();
    // let tab = tabhost.children()[0];
    // let bar = tab.children()[tab.children().length - 1]; // 有些tab会中间多一个，一般都是2个，所以用这个方式来取
    // let items = bar.find(className("FrameLayout"));
    // let msg = items[4]; // 第3个消息 // TODO: 为什么是第4个没整明白

    // .filter((e) => e.text() == "消息")
    let mt = tabhost.find(className("TextView").text("消息")).filter((e) => e.parent().className().indexOf("RelativeLayout") > 0)
    console.log("可能为消息的按钮有", mt.length, "个")
    if (mt.length === 0) return null
    let msg = mt[0].parent().parent().parent()

    let txts = msg.find(className("TextView"));

    return { element: msg, count: txts.length > 1 ? parseInt(txts[1].text() || 0) : 0, maxTop: msg.bounds().top }
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

    console.log("有更多: " + hasMore, "大概总数:" + items.length)
    
    // 1. 过滤非个人私信
    // 老方式：items.slice(0, items.length - (hasMore ? 0 : 1))
    let records = container.find(className("LinearLayout")).filter((e) => e.children().length === 3).map(function(e) {
        let h = e.children()[0]; // 头像
        let m = e.children()[1]; // 暱称和内容
        let t = e.children()[2]; // 时间和消息数

        // 更多，或者是第一个
        // e.className().indexOf("FrameLayout") < 0 // 11.3, 是FrameLayout
        if (
            h.find(className("ImageView")).length > 0 // 头像出会有"官方"图片字样
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

    // 找到头像
    let mmsgs = className("com.bytedance.ies.dmt.ui.widget.DmtTextView").find().map((e) => {
        // 父级查找文本,图片等
        let txt = e.parent().findOne(className("TextView"))
        let img = e.parent().findOne(className("ImageView"))
        if (!txt && !img) {
            console.log("未知消息类型")
            return null
        }

        let ct = txt || img

        return {
            content: img ? "[IMAGE]" : txt,
            self: ct.bounds().left < e.bounds().left, // 内容在头像的左边
        }
    }).filter((e) => e)

    return mmsgs

    // 这个方法不太安全
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
    let sbtn = className("ImageView").desc("发送").findOne()
    if (!sbtn) {
        console.log("未找到发送按钮")
        toast("发送按钮查找失败")
        sleep(1000)
        return
    }
    if (!debug) sbtn.click();
    sleep(1000)
}

// 是否滑动到了底部
function isScrollEnd() {
    let txts = className("TextView").find();
    return txts[txts.length - 4] && txts[txts.length - 4].text().indexOf("无更多") >= 0
}

// 主要处理过程
function process({max, max_continue, max_wait_for, msgs, keywords, onlyUnread, debug, wait}) {

    // 判断消息内容
    if (!msgs || msgs.length === 0) {
        toast("未设置发送内容");
        return;
    }

    // 默认最大次数
    if (!max) max = 200;
    
    // 处理关键词
    keywords = keywords?keywords.split(',').filter((v) => v):[]

    // 判断是否是陌生人消息
    if (className("TextView").text("一键已读").find().length > 0) {
        toast("在陌生人信息列表");
        console.log("在陌生人")
        sleep(1000);
        processStranger({
            max: max, max_continue: max_continue, max_wait_for: max_wait_for,
            keywords: keywords, debug: debug, msgs: msgs, wait: wait
        })
        toast("陌生人消息全部获取完成");
        sleep(1000);
        return;
    }

    // 获取消息节点和当前具备的新消息数量
    let { element, count, maxTop } = getMessageCount();

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
    let _sended = {};

    // 如果到达最大次数，可以选择休息一定时间再继续
    while (max > totalCount) {
        // 查找消息列表
        let { hasMore, records } = findMessages();
    
        sleep(1000);

        for (let i=0; i<records.length; i++) {

            if (totalCount >= max) {
                if (max_continue) {
                    // 计数清零
                    totalCount = 0
                    // 刚达到最大，选择休息
                    toast("到达最大次数" + max + "，休眠" + max_wait_for + "分钟")
                    console.log("到达最大次数" + max + "，休眠" + max_wait_for + "分钟")
                    let _sleep_time = max_wait_for * 1000 * 60 // 分钟
                    sleep(_sleep_time)
                } else {
                    console.log("发送数量达总量:"+totalCount);
                    toast("发送数量达总量:"+totalCount);
                    sleep(2000)
                    break;
                }
            }

            let e = records[i]
            let bound = e.element.bounds();
            let centerX = bound.centerX();
            let centerY = bound.centerY();

            // 判断是否超出了框内

            if (e.nickname === "陌生人消息") {
                // TODO:
                toast("暂不支持~请先进入陌生人消息再启动")
                sleep(1000);
                return
            }

            // 检查是否已经发送过了
            if (_sended[e.nickname]) {
                // 在已发送列表
                console.log(e.nickname+"已处理~");
                return;
            }

            toast(e.nickname);
            sleep(2000);

            // 判断是否达到限制
            if (!debug && !audit()) {
                max = 0; // 需要终止整个循环
                return;
            }

            // 点击进去 ??? 为什么点击不进去
            // console.log("===>", e.element.clickable(), e.element.id(), e.element.className())
            // 过滤高度
            if (centerY > maxTop) {
                console.log("可能会点到下面的Bar，所以跳过")
                return;
            }
            click(centerX, centerY);
            // e.element.click();
            sleep(1000);

            _sended[e.nickname] = true;

            // 读取出所有消息
            let rmsgs = parseMessages().filter((e) => e);

            if (rmsgs.length === 0) {
                toast("该用户未发送任何消息");
                console.log("该用户未发送任何消息");
                sleep(1000);
                // 返回列表
                back();
                return;
            }

            // 判断最后一条是不是自己
            if (rmsgs[rmsgs.length - 1].self) {
                toast("您已回复过~");
                sleep(1000);
                back();
                // 返回列表
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
            toast("第" + totalCount + "条消息发送成功" + (debug?" [DEBUG]": ""));
            console.log("第" + totalCount + "条消息发送成功" + (debug?" [DEBUG]": ""));
            sleep(2000);

            // 返回列表
            back();

            // 间隔的时间
            let _wait = wait.start + getRandomInt(wait.end - wait.start);
            toast("等待 "+_wait+"s 继续");
            sleep(_wait * 1000);
        };
    
        // 没有更多内容
        if (!hasMore) break;

        // 还有更多内容就向下滚动，向下滚动
        if (totalCount < max || max_continue ) {
            // 向下滚动屏幕
            let r = swipe(200, 1200, 430, 100, 1000);
            if (!r) {
                toast("向下滚动失败");
                console.log("向下滚动失败.")
                sleep(2000);
                break;
            } else {
                toast("向下滚动成功~")
                console.log("向下滚动成功~")
            }
            sleep(2000);
        }
    }

    toast("全部获取完成");
    sleep(1000);

    return;
}

// 陌生人消息处理
function processStranger({ debug, max, max_continue, max_wait_for, keywords, msgs, wait }) {

    toast("处理陌生人消息~")
    sleep(1000)

    // 默认最大次数
    if (!max) max = 200;

    let totalCount = 0;
    let _sended = {};

    // 查找所有消息
    while (max > totalCount) {
        // 查找消息列表
        let { hasMore, records } = findStrangerMessages();

        for (let i=0; i<records.length; i++) {
            let e = records[i]

            if (totalCount >= max) {
                if (max_continue) {
                    // 计数清零
                    totalCount = 0
                    // 刚达到最大，选择休息
                    toast("到达最大次数" + max + "，休眠" + max_wait_for + "秒")
                    console.log("到达最大次数" + max + "，休眠" + max_wait_for + "秒")
                    let _sleep_time = max_wait_for * 1000
                    sleep(_sleep_time)
                } else {
                    console.log("发送数量达总量:"+totalCount);
                    toast("发送数量达总量:"+totalCount);
                    sleep(2000)
                    break;
                }
            }

            // 检查是否已经发送过了
            if (_sended[e.nickname]) {
                // 在已发送列表
                console.log(e.nickname+"已处理~");
                return;
            }

            let bound = e.element.bounds();
            let centerX = bound.centerX();
            let centerY = bound.centerY();

            toast(e.nickname)
            sleep(1000)

            // 判断是否达到限制
            if (!debug && !audit()) {
                max = 0; // 需要终止整个循环
                return;
            }

            // 点击进去消息列表
            click(centerX, centerY);
            // e.element.click();
            sleep(1000);

            // 记住
            _sended[e.nickname] = true;

            // 读取出所有消息
            let rmsgs = parseMessages().filter((e) => e);


            // 判断最后一条是不是自己
            if (rmsgs[rmsgs.length - 1].self) {
                toast("您已回复过~");
                sleep(1000);
                back();
                // 返回列表
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
            toast("陌生人的第" + totalCount + "条消息发送成功" + (debug?" [DEBUG]": ""));
            console.log("陌生人的第" + totalCount + "/" + max + "条消息发送成功" + (debug?" [DEBUG]": ""));
            sleep(2000);

            // 返回列表
            back();

            // 间隔的时间
            let _wait = wait.start + getRandomInt(wait.end - wait.start);
            toast("等待 "+_wait+"s 继续");
            sleep(_wait * 1000);
        }

        if (!hasMore) break;

        // 滚动
        // 还有更多内容就向下滚动，向下滚动
        if (totalCount < max || max_continue ) {
            // 向下滚动屏幕
            let r = swipe(200, 1200, 430, 100, 1000);
            if (!r) {
                toast("向下滚动失败");
                console.log("向下滚动失败.")
                sleep(1000);
                break;
            } else {
                toast("向下滚动成功~")
                console.log("向下滚动成功~")
                sleep(2000);
            }
        }
    }

    return totalCount;
}


// 找到陌生人的私信
function findStrangerMessages() {

    let container = className("android.support.v7.widget.RecyclerView").findOne(); // ViewPager

    let items = container.children();

    let hasMore = !(items[items.length - 1].className().indexOf("FrameLayout") > 0
        && items[items.length - 1].children()[0].text() === "无更多消息");
    
    console.log("有更多: " + hasMore, "大概总数:" + items.length)
    
    // 1. 过滤非个人私信
    // 老方式：items.slice(0, items.length - (hasMore ? 0 : 1))
    let records = container.find(className("LinearLayout")).filter((e) => e.children().length === 3).map(function(e) {
        let h = e.children()[0]; // 头像
        let m = e.children()[1]; // 暱称和内容
        let t = e.children()[2]; // 时间和消息数

        // 更多，或者是第一个
        if (
            // e.children().length !== 3 // 第一个会长度不是3
            // || e.className().indexOf("LinearLayout") < 0 // 没有更多是FrameLayout
            false || h.find(className("ImageView")).length > 0 // 头像出会有"官方"图片字样
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

// 获取随机整数
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// 入口函数
function main(_) {
    args = _;
    process(args);
}