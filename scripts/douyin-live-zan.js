let args = {
    "wait":{"start":0,"end":1},
    "debug":true,
    "max": 10,
    "username":"luopeng",
    "token":"1325be6b-5cd0-4653-9041-d1f53d5dc9e0",
    "server":"http://122.112.152.5",
}

function process({ max, debug, wait }) {


    let sw = device.width / 2 - getRandomInt(10)
    let sh = device.height / 2 - 200 - getRandomInt(10)
    if (sw < 10 || sh < 10) {
        sw = 300
        sh = 500
    }
    console.log("开始点赞，屏幕大小", device.width, " * ", device.height, "点击：", sw, " * ", sh)
    toast("开始点赞\n屏幕大小" + device.width + " * " + device.height +"\n点击：" + sw + " * " + sh)
    sleep(1000)

    // 点赞

    let totalCount = 0

    while (max > totalCount) {

        // 双击屏幕中心
        console.log("== 0 ===>", click(sw, sh))
        sleep(100)
        console.log("== 1 ===>", click(sw, sh))

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