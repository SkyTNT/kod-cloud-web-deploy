const axios = require("axios");
const qs = require("qs");
const fs = require("fs");
const FormData = require("form-data");

class KodCloud{

  constructor(address){
    this.address=address;
    this.token="";
  }

  async login(user,pwd){
    console.log(this);
    console.log(`login as ${user}`);
    let data=(await axios.get(`${this.address}?user/index/loginSubmit&name=${user}&password=${pwd}`)).data;
    if(data.code)
    {
      this.token=data.info;
      console.log(this.token);
    }
    console.log(data.data);
    return data.code;
  }

  async logout(){
    console.log("logout")
    let data=(await axios.get(`${this.address}?user/index/logout&accessToken=${this.token}`)).data;
    console.log(data.data);
  }

  async getFlieList(path){
    console.log(`get files at ${path}`);
    let data=(await axios.post(`${this.address}?explorer/list/path&accessToken=${this.token}`,`path=${path}`)).data;
    let files=[];
    if(data.code){
      data.data.folderList.forEach((item, i) => {
        files.push(item);
      });
      data.data.fileList.forEach((item, i) => {
        files.push(item);
      });
    }
    return files;
  }

  async deleteFiles(files)
  {
    files.forEach((item, i) => {
      console.log(`delete ${item.path}`);
    });
    let data=(await axios.post(`${this.address}?explorer/index/pathDelete&accessToken=${this.token}`,qs.stringify({dataArr:JSON.stringify(files),shiftDelete:1}))).data;
    console.log(data.data);
    return data.code;
  }

  async mkdir(path){
    console.log(`create folder ${path}`);
    let data=(await axios.post(`${this.address}?explorer/index/mkdir&accessToken=${this.token}`,qs.stringify({path}))).data;
    console.log(data.data);
    return data.code;
  }

  async upload(local,remote)
  {
    console.log(`upload ${local} to ${remote}`);
    let form = new FormData();
    let lastIndex=remote.lastIndexOf("/");
    form.append("path",remote.substr(0,lastIndex+1));
    form.append("name",remote.substr(lastIndex+1));
    form.append("file",fs.createReadStream(local));
    let headers = form.getHeaders();
    let data=(await axios.post(`${this.address}?explorer/upload/fileUpload&accessToken=${this.token}`,form,{headers})).data;
    console.log(data.data);
    return data.code;
  }

  async unzip(path,pathTo){
    console.log(`unzip ${path} to ${pathTo}`);
    let data=(await axios.post(`${this.address}?explorer/index/unzip&accessToken=${this.token}`,qs.stringify({path,pathTo}))).data;
    console.log(data.data);
    return data.code;
  }


}

module.exports = KodCloud;
