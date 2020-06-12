let args = {
    "wait":{"start":2,"end":4},
    "debug":true,
    "max": 100,
    "username":"luopeng",
    "token":"1325be6b-5cd0-4653-9041-d1f53d5dc9e0",
    "server":"http://122.112.152.5",
}

// 是否是关注列表
function isFollowerTab() {
    let firstTab = className("android.support.v7.app.ActionBar$Tab").findOne()
    if (!firstTab) {
        toast("可能不在关注列表页")
        console.log("可能不在关注列表页")
        sleep(2000)
        return false;
    }

    let r = firstTab.findOne(className("TextView").textContains("关注")) != null
    if (r) firstTab.click()
    return r
}

// 查找关注的人
function findFollowings() {

    // 目前版本 查找  已关注 互相关注
    // 暱称暂不处理

    let items = []

    let txts = ["已关注", "互相关注"]
    txts.forEach((t) => className("TextView").text(t).find().forEach((e) => items.push(e)))

    let hasMore = text("发现好友").find().length === 0 || text("暂时没有更多了").find().length === 0

    return {items: items, hasMore: hasMore}
}

function unfollow(e, debug) {
    // TODO: 如果不能点击呢?
    // 再次确认下
    // let text = id(e.id()).findOne().text()
    // if (text === "关注" || text === "回关") {
    //     console.log("已经被取消关注了", e.bounds())
    //     return
    // } 
    if (!debug) e.click()
    toast("取消关注成功" + (debug?"[DEBUG]":""))
    sleep(1000)
}

function process({ wait, max, debug }) {

    if (!max) max = 500

    let infollpage = isFollowerTab()
    if (!infollpage) {
        return
    }

    let followedSigneds = ["已关注", "互相关注"]

    toast("查询关注的列表")
    sleep(1000)

    let totalCount = 0

    while (max > totalCount) {

        // 查询界面上的列表和是否有更多
        let { items, hasMore } = findFollowings()

        // 处理每一项
        // followedSigneds.forEach((t) => className("TextView").text(t).find().forEach((e) => items.push(e)))

        console.log("查找到", items.length, "个关注")
        toast("查找到" + items.length + "个关注")
        sleep(1000)

        items.forEach((e) => {

            // 取消关注
            unfollow(e, debug)
            
            // TODO: 正确判断
            totalCount += 1

            // 间隔的时间
            let _wait = wait.start + getRandomInt(wait.end - wait.start);
            toast("等待 "+_wait+"s 继续");
            sleep(_wait * 1000);
        })

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

    toast("执行完成~ 共取消关注:" + totalCount + "个")
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