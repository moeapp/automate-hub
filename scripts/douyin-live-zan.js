let args = {
    "wait":{"start":2,"end":4},
    "debug":true,
    "max": 3,
    "username":"luopeng",
    "token":"1325be6b-5cd0-4653-9041-d1f53d5dc9e0",
    "server":"http://122.112.152.5",
}

function process({ max, debug, wait }) {


    let sw = device.width / 2 + getRandomInt(0 - 10)
    let sh = device.height / 2 + getRandomInt(0 - 10)
    console.log("开始点赞，屏幕大小", device.width, "*", device.height)
    toast("开始点赞，屏幕大小" + device.width + "*" + device.height)
    sleep(1000)

    // 点赞

    let totalCount = 0

    while (max > totalCount) {

        // 双击屏幕中心
        click(sw, sh)
        sleep(200)
        click(sw, sh)

        // dialogs.confirm("哈哈", "好的")

        totalCount += 1

        // 间隔的时间
        let _wait = wait.start + getRandomInt(wait.end - wait.start);
        toast("等待 "+_wait+"s 继续");
        sleep(_wait * 1000);
    }

    // 执行结束
    console.log("完成点赞,共", totalCount, "次任务")
    toast("完成点赞,共" + totalCount + "次任务")
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