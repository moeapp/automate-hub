import demo from "../../actions/demo"

function main() {
  console.log("====>");
  demo();
}

export default {
  name: "视频留言评论",
  description: "自动在短视频下方进行留言评论",
  main: main, // define the index function
};
