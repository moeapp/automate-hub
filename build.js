const { startService } = require("esbuild");
const fs = require("fs");
const path = require("path");

let esbuild;

function walkFile(startPath, filter, callback, recurse = true) {
  if (!fs.existsSync(startPath)) return;

  let files = fs.readdirSync(startPath);

  files.forEach((v) => {
    var filename = path.join(startPath, v);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      walkFile(filename, filter, callback, recurse); // recurse
      return;
    }

    if (
      (typeof filter === "string" && filter === v) ||
      (filter.test && filter.test(filename))
    ) {
      callback(filename);
    }
  });
}

const CWD = process.cwd();
const CACHEDIR = ".cache"

const TARGETDIR = "dist"

// require with es6 supported
async function mrequire(v) {
  let tmp = CACHEDIR + "/" + v.split("/").slice(-3).join("__");
  await esbuild.build({
    outfile: tmp,
    entryPoints: [v],
    bundle: true,
    format: "cjs",
  })

  let r = require(CWD + "/" + tmp)
  return r.default
}


// 别设计，最小化快速实现!!!

async function parse() {
  let apps = [];

  let _appfiles = []; walkFile(CWD, "index.js", (v) => _appfiles.push(v));

  // 1. 搜索所有的 index => app 定义
  await Promise.all(_appfiles.map(async (v) => {

    // 不能直接require，通过编译后的来引入
    let app = await mrequire(v);

    if (!app || !app.package) return;

    console.log("[INFO] add application:", app.package || app.app);

    // load pipelines in current app
    app._basepath = path.dirname(v);

    app.pipelines = [];

    if (!app.id) app.id = path.basename(app._basepath);

    // 2. 遍历 index 找到当前 app 下所有的 pipelines
    let _pipelinefiles = []; walkFile(app._basepath, /\.js$/, (v) => _pipelinefiles.push(v));

    await Promise.all(_pipelinefiles.map(async (v) => {
      // load pipelines
      let pipeline = await mrequire(v);

      // ignore index.js
      if (v.indexOf("index.js") > 0) return;

      // merge pipeline with app
      pipeline = {
        ...app,
        ...pipeline,
        main: pipeline.main.name, // main is the function main
        appid: app.id,
        _filename: v,
        id: pipeline.id || app.id + "/" + path.basename(v, ".js"), // combine app id and pipeline id
      };

      // remove pipelines from app at pipeline
      delete pipeline.pipelines;

      app.pipelines.push(pipeline);

    }))

    apps.push(app);
  }));

  return apps;
}

async function release(apps) {
  let rs = [];
  let pipelines = [];

  // 编译文件
  apps.forEach((app) => {
    app.pipelines.forEach((pl) => {
      console.log("[INFO] build pipeline:", pl.id);

      pipelines.push(pl)

      let index = "pipelines/" + pl.id.replace("/", "__") + ".js"


      pl.index = index

      // 编译
      let r = esbuild.build({
        outfile: TARGETDIR + "/" + index,
        entryPoints: [pl._filename],
        bundle: true,
        format: "cjs",
      });

      // remove unused fields
      delete pl._filename
      delete pl._basepath

      rs.push(r);
    });
  });

  // TODO: load other data
  let data = {
    pipelines,
  }

  // 生成文件
  // TODO: yaml ???
  fs.writeFileSync(TARGETDIR + "/index.json", JSON.stringify(data))

  await Promise.all(rs);
}

async function handle() {
  let apps = await parse();

  await release(apps);
}

async function main() {
  console.log("[INFO] start building");

  esbuild = await startService();

  try {
    await handle();
  }catch(e) {
    console.log(e);
  }
  
  // TODO: delete .cache

  esbuild.stop();

  console.log("[INFO] finish building");
}

main();
