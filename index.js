const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const exec = require('@actions/exec');
const path = require('path');
const fs = require('fs');
const ExecOptions = require('@actions/exec/lib/interfaces').ExecOptions;

async function run() {
  try {
    const IS_WINDOWS = process.platform == 'win32';

    if (IS_WINDOWS === false) {
      core.setFailed('vstest.console.exe only works for Windows');
      return;
    }

    const directoryToAddToPath = await tc.find('vswhere', '2.7.1');

    if (directoryToAddToPath) {
      console.log(`Found local cached tool at ${directoryToAddToPath} adding that to path`);

      const vstestPath = await FindVSTest(directoryToAddToPath);
      console.log(`vstestPath == ${vstestPath}`);

      await core.addPath(vstestPath);
      return;
    }

    console.log("Downloading VSWhere v2.7.1 tool");
    const vswherePath = await tc.downloadTool("https://github.com/microsoft/vswhere/releases/download/2.7.1/vswhere.exe");

    const folder = path.dirname(vswherePath);
    const fullPath = path.join(folder, "vswhere.exe");
    fs.renameSync(vswherePath, fullPath);

    const cachedToolDir = await tc.cacheDir(folder, 'vswhere', '2.7.1');
    console.log(`Cached Tool Dir ${cachedToolDir}`);

    const vstestPath = await FindVSTest(cachedToolDir);
    console.log(`vstestPath == ${vstestPath}`);

    await core.addPath(vstestPath);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function FindVSTest(pathToVSWhere) {
  let vstestPath = "";
  const options = {
    listeners: {
      stdout: data => {
        vstestPath += data.toString();
      }
    }
  }

  const vswhereExe = path.join(pathToVSWhere, 'vswhere.exe');
  await exec.exec(vswhereExe, ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Workload.ManagedDesktop', 'Microsoft.VisualStudio.Workload.Web', '-requiresAny', '-find', '**\\vstest.console.exe'], options);

  if (vstestPath === '') {
    core.setFailed('Unable to find vstest.console.exe');
  }

  console.log(`vstestPath = ${vstestPath}`);
  const folderForVstest = path.dirname(vstestPath.split('\n')[0]);
  console.log(`Folder for vstest ${folderForVstest}`);

  return folderForVstest;
}

run();
