let args = {
    "wait":{"start":2,"end":4},
    "debug":true,
    "max": 100,
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

// 查找等待回关的粉丝
function findFansFollowings() {

    // 目前版本 查找  回关
    // 暱称暂不处理

    let items = []

    let txts = ["回关"]
    txts.forEach((t) => className("TextView").text(t).find().forEach((e) => items.push(e)))

    let hasMore = text("暂时没有更多了").find().length === 0

    return {items: items, hasMore: hasMore}
}

function follow(e, debug) {
    // TODO: 如果不能点击呢?
    if (!debug) e.click()
    toast("关注成功" + (debug?"[DEBUG]":""))
    sleep(1000)
}

function process({ wait, max, debug }) {

    if (!max) max = 500

    let infollpage = isFansFollowerTab()
    if (!infollpage) {
        console.log("非粉丝列表页")
        return
    }

    toast("查询待回关的列表")
    sleep(1000)

    let totalCount = 0

    while (max > totalCount) {

        // 查询界面上的列表和是否有更多
        let { items, hasMore } = findFansFollowings()

        console.log("查找到", items.length, "个待回关")
        toast("查找到" + items.length + "个待回关")
        sleep(1000)

        for (let i=0; i<items.length; i++) {
            let e = items[i]
            if (totalCount >= max) {
                console.log("总量:"+totalCount);
                toast("总量:"+totalCount);
                sleep(2000)
                break;
            }

            // 回关粉丝
            follow(e, debug)
            
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