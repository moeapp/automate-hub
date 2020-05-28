
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
        toast(r.msg);
    } catch(e) {
        console.log(e);
        return false;
    }
    sleep(1000);
}

// 是否在私信Tab
function isMessageTab() {

}

// 是否滑动到了底部
function isScrollEnd() {
    let txts = className("TextView").find();
    return txts[txts.length - 4] && txts[txts.length - 4].text().indexOf("无更多") >= 0
}

// 主要处理过程
function process({max, msgs, keywords, debug}) {

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

    // 如果不在私信页，点击按钮
}

// 入口函数
function main(_) {
    args = _;
    process(args);
}


// 调试
main(args);