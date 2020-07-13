

// 用户信息等

export default class User {
    constructor({ username, password, server, token }) {
        super()

        this.username = username;
        this.password = password;
        this.server = server;
        this.token = token;

        // login or fetch the user information
    }

    // curren tt user information
    username;
    password;
    server;
    token;

    // 检查次数
    audit(channel) {
        try {
            res = http.post(args["server"] + "/counter", {username: this.username, token: this.token});
            str = res.body.string();
            r = JSON.parse(str);
            if ( r.status === "200" ) return true;
            return false;
        }catch(e) {
            return false;
        }
    }
}