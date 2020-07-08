const { startService } = require("esbuild");
const fs = require("fs");
const path = require("path");

// const yaml = require("js-yaml");

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

// build({
//   entryPoints: ["./src/main.ts"],
//   outfile: "./dist/main.js",
//   minify: true,
//   bundle: true,
// }).catch(() => process.exit(1));

// 别设计，最小化快速实现!!!

function parse() {
  let apps = [];

  // 1. 搜索所有的 index => app 定义
  walkFile(process.cwd(), "index.js", (v) => {
    let app = require(v);
    if (!app || !app.package) return;

    console.log("[INFO] add application:", app.package || app.app);

    // load pipelines in current app
    app._basepath = path.dirname(v);

    app.pipelines = [];

    if (!app.id) app.id = path.basename(app._basepath);

    // 2. 遍历 index 找到当前 app 下所有的 pipelines
    walkFile(app._basepath, /\.js$/, (v) => {
      // ignore index.js
      if (v.indexOf("index.js") > 0) return;

      // load pipelines
      let pipeline = require(v);
      // merge pipeline with app
      pipeline = {
        ...app,
        ...pipeline,
        main: pipeline.main.name, // main is the function main
        _appID: app.id,
        _filename: v,
        id: pipeline.id || app.id + "/" + path.basename(v, ".js"), // combine app id and pipeline id
      };

      // remove pipelines from app at pipeline
      delete pipeline.pipelines;

      app.pipelines.push(pipeline);
    });

    apps.push(app);
  });

  return apps;
}

async function release(service, apps) {
  let rs = [];
  let pipelines = [];
  apps.forEach((app) => {
    app.pipelines.forEach((pl) => {
      console.log("[INFO] build pipeline:", pl.id);
      let r = service.build({
        outfile: "dist/pipelines/" + pl.id.replace("/", "__") + ".js",
        entryPoints: [pl._filename],
        bundle: false,
      });
      rs.push(r);

      // TODO: generate index.yaml
    });
  });

  await Promise.all(rs);
}

async function handle(service) {
  let apps = parse();

  await release(service, apps);
}

async function main() {
  // default load from `m`
  console.log("[INFO] start building");
  // start service
  const service = await startService();

  await handle(service);

  service.stop();

  console.log("[INFO] finish building");
}

main();
