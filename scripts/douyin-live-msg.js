let args = {
    "wait":{"start":0,"end":1},
    "debug":true,
    "max": 100,
    "msgs":["6666666666666666666666666666666666666"],
    "username":"luopeng",
    "token":"1325be6b-5cd0-4653-9041-d1f53d5dc9e0",
    "server":"http://122.112.152.5",
}


// 发送消息
function send({ msg, debug}) {
    // 点击输入框
    let say = className("TextView").text("说点什么...")
    if (!say) {
        toast("未找到内容输入框")
        console.log("未找到内容输入框")
        sleep(1000)
        return
    }

    // 点击说点什么
    say.click()
    sleep(1000)

    setText(msg);
    sleep(1000);

    // 找到发送按钮
    let sbtn = className("ImageView").find()[1]
    if (!sbtn) {
        console.log("未找到发送按钮")
        toast("发送按钮查找失败")
        sleep(1000)
        // 返回
        back()
        return
    }
    if (!debug) sbtn.click();
    sleep(1000)
}

function process({ max, debug, wait, msgs }) {

    console.log("开始给直播留言")
    toast("开始给直播留言")
    sleep(1000)

    // 点赞

    let totalCount = 0

    while (max > totalCount) {

        // 发送消息
        send({ msg: msgs[getRandomInt(msgs.length)], debug: debug });

        // dialogs.confirm("哈哈", "好的")

        totalCount += 1

        // 间隔的时间
        let _wait = wait.start + getRandomInt(wait.end - wait.start);
        toast("等待 "+_wait+"s 继续");
        sleep(_wait * 1000);
    }

    // 执行结束
    console.log("留言完成,共", totalCount, "次任务")
    toast("留言完成,共" + totalCount + "次任务")
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