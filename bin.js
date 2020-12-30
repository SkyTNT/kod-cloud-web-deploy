#! /usr/bin/env node

const KodCloud = require("./kodcloud")
const archiver = require('archiver');
const fs = require("fs");
const {
  Command
} = require('commander');

const program = new Command();

program.version('1.0.0');

program
  .requiredOption('-a, --address <address>', 'address of KodCloud')
  .option('-u, --user <user>', 'user name')
  .option('-p, --password <pwd>', 'user password')
  .requiredOption('-P, --path <path>', 'Physical path of web on KodCloud')
  .requiredOption('-t, --target <folder>', 'target folder');

program.parse(process.argv);

let cloud = new KodCloud(program.address);

process.stdin.setEncoding('utf8');
function readlineSync() {
    return new Promise((resolve, reject) => {
        process.stdin.resume();
        process.stdin.on('data', function (data) {
            process.stdin.pause();
            resolve(data.trim());
        });
    });
}

async function packZip(path, dest) {
  console.log(`pack ${path} to ${dest}`);
  let output = fs.createWriteStream(dest);
  let archive = archiver('zip', {
    zlib: {
      level: 9
    }
  });
  archive.pipe(output);
  archive.directory(path, false);
  await archive.finalize();
  console.log("ok");
}

(async () => {
  try {

    if(!program.user)
    {
      console.log("user name:");
      program.user=await readlineSync();
    }
    if(!program.password)
    {
      console.log("password:");
      program.password=await readlineSync();
    }

    if (!await cloud.login(program.user, program.password))
      return;

    let files, filesToDel = [];
    files = await cloud.getFlieList(program.path);
    if (files.length > 0) {
      files.forEach((item, i) => {
        filesToDel.push({
          path: item.path,
          name: item.name,
          type: item.type
        });
      });
      if (!await cloud.deleteFiles(filesToDel))
        return;
    }

    await packZip(program.target, './temp.zip');

    if (!await cloud.upload('./temp.zip', `${program.path}temp.zip`))
      return;
    if (!await cloud.unzip(`${program.path}temp.zip`, program.path))
      return;
    if (!await cloud.deleteFiles([{
        path: `${program.path}temp.zip`,
        name: 'temp.zip',
        type: 'file'
      }]))
      return;
    console.log(`delete ./temp.zip`);
    fs.unlink("./temp.zip",error=>{
      if(error)
      {
        console.log(error);
        return false;
      }
    });
  } catch (e) {
    console.log(e);
  } finally {
    await cloud.logout();
  }
})();
