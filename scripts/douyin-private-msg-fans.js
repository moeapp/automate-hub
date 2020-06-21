let args = {
    "wait":{"start":2,"end":4},
    "debug":true,
    "max": 100,
    "msgs":["Hello, 你好"],
    "username":"luopeng",
    "token":"1325be6b-5cd0-4653-9041-d1f53d5dc9e0",
    "server":"http://122.112.152.5",
}

// 是否是粉丝列表
function isFansFollowerTab() {
    let tabs = className("android.support.v7.app.ActionBar$Tab").find()
    if (!tabs || tabs.length !== 2) {
        toast("可能不在粉丝列表页")
        console.log("可能不在粉丝列表页")
        sleep(2000)
        return false;
    }

    let r = tabs[1].find(className("TextView").textContains("粉丝")) != null
    if (r) tabs[1].click()
    return r
}

// 查找粉丝列表
function findFansFollowings() {

    // 目前版本 查找  回关
    // 暱称暂不处理

    let items = []

    // 不需要回关按钮而是直接粉丝项目
    let txts = ["回关", "互相关注"]
    txts.forEach((t) => className("TextView").text(t).find().forEach((e) => {
        // 取得父节点, TODO: fixme
        let ee = e.parent().parent().parent();
        // console.log("查找父节点")
        // 左边为0  RelativeLayout 就是我们要找的
        // while (ee.bounds().left !== 0 || ee.className() !== "android.widget.RelativeLayout") {
        //     console.log("===>", ee.bounds(), ee.className())
        //     ee = e.parent()
        //     console.log("parent ===>", ee.bounds(), ee.className())
        // }
        items.push(ee)
    }))

    let hasMore = text("暂时没有更多了").find().length === 0

    return {items: items, hasMore: hasMore}
}

// 发送私信，点击进入 -> 点击右上角 -> 点击发送私信 -> 发送
function handle_send_msg(e, msg, debug) {
    e.click() // 进入粉丝详情
    sleep(2000)


    // 点击右上角更多
    let more = className("ImageView").desc("更多").findOne()
    if (!more) {
        // 找不到更多按钮
        console.log("找不到更多按钮")
        toast("找不到更多的按钮，无法打开菜单")
        sleep(1000)
        // 返回列表
        back();
        return;
    }

    // 点击打开菜单
    more.click()
    console.log("点击更多")
    toast("点击更多")
    sleep(1000)

    // 找到发送私信的按钮
    let sendmsg = className("TextView").text("发私信").findOne()
    if (!sendmsg) {
        // 找不到发私信按钮
        console.log("找不到发私信按钮")
        toast("找不到发私信")
        sleep(1000)

        // 退出菜单
        // 返回列表
        back();
        return;
    }

    // 点击发送私信按钮
    sendmsg.click()
    console.log("点击发送私信")
    toast("点击发送私信")
    sleep(1000)

    // 解析消息面板, 读取出所有消息
    let rmsgs = parseMessages().filter((e) => e);
    // 判断最后一条是不是自己
    if (rmsgs.length > 0 && rmsgs[rmsgs.length - 1].self) {
        toast("您已回复过~");
        sleep(1000);
        back();
        // 返回列表
        return;
    }

    // 发送消息
    send({msg: msg, debug: debug})
    // 返回详情
    back();

    sleep(1000)

    // 返回列表
    back()
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
}

// 在消息页面发送发送消息
function send({ msg, debug }) {
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
    toast("发送成功" + (debug?"[DEBUG]":""))
    sleep(1000)
}

function process({ wait, max, debug, msgs }) {

    if (!max) max = 500

    let infollpage = isFansFollowerTab()
    if (!infollpage) {
        console.log("非粉丝列表页")
        return
    }

    toast("查询粉丝的列表")
    sleep(1000)

    let totalCount = 0

    while (max > totalCount) {

        // 查询界面上的列表和是否有更多
        let { items, hasMore } = findFansFollowings()

        console.log("查找到", items.length, "个粉丝")
        toast("查找到" + items.length + "个粉丝")
        sleep(1000)

        for (let i=0; i<items.length; i++) {
            let e = items[i]
            if (totalCount >= max) {
                console.log("总量:"+totalCount);
                toast("总量:"+totalCount);
                sleep(2000)
                break;
            }

            // TODO: 过滤已经发送过的人

            // 给粉丝发送私信
            let msg = msgs[getRandomInt(msgs.length)] // 随机产生一条消息
            handle_send_msg(e, msg, debug)
            
            // TODO: 正确判断
            totalCount += 1

            // 间隔的时间
            let _wait = wait.start + getRandomInt(wait.end - wait.start);
            toast("等待 "+_wait+"s 继续");
            sleep(_wait * 1000);
        }

        // 没有更多内容
        if (!hasMore) break;

        // 还有更多内容就向下滚动，向下滚动
        if (totalCount < max ) {
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

    toast("执行完成~ 共回关:" + totalCount + "个")
    sleep(1000)
}


// 获取随机整数
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// 入口函数
function main(_) {
    args = _
    process(args)
}