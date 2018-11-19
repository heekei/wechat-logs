<template>
  <div class="home-ctn clearfix">
    <h1>{{header.title}}</h1>
    <h3>报警时间范围：{{firstDataTime + ' —— ' + lastestLogTime}}</h3>
    <div class="table-ctn">
      <el-table height="calc(100vh - 200px)" :data="logs" style="width: 50%;">
        <el-table-column sortable prop="time" label="日期">
        </el-table-column>
        <el-table-column sortable prop="type" label="错误类型">
        </el-table-column>
        <el-table-column sortable prop="interval" label="频率（次/分钟）">
        </el-table-column>
        <el-table-column prop="position" label="样例">
        </el-table-column>
      </el-table>
      <el-table height="calc(100vh - 200px)" :data="statistical" style="width: 50%;">
        <el-table-column sortable prop="name" label="错误详情">
        </el-table-column>
        <el-table-column sortable prop="times" width="100px" label="次数">
        </el-table-column>
        <!-- <el-table-column sortable prop="interval" label="频率（次/分钟）">
        </el-table-column>
        <el-table-column prop="position" label="样例">
        </el-table-column> -->
      </el-table>
    </div>
    <el-button type="primary" :disabled="allLoaded" :loading="busy" @click="loadMore">{{allLoaded?'已加载全部数据':busy?'加载中……':'点击查看更多'}}</el-button>
  </div>
</template>

<script>
import axios from "axios";
import * as API from "../API/Service.js";
import md5 from 'js-md5';
export default {
  name: "Home",
  data() {
    return {
      logs: [],
      header: {},
      count: 10,
      busy: false,
      types: {},
      typesMap: {},
      statistical: [],
      allLoaded: false,
      firstDataTime: null,
      lastestLogTime: null // 最新一条的报告时间
    };
  },
  created() {
    this.getLogs(this.count, true);
    setInterval(() => {
      this.getLatestLogs();
    }, 5000);
  },
  methods: {
    getLogs(count, init) {
      if (this.busy) return;
      this.busy = true;
      var that = this;
      API.chatlog(this.count).then(res => {
        if (init) {
          that.header = res.data.splice(0, 1)[0];
        } else {
          /* 只处理最后10条数据 */
          res.data.splice(0, res.data.length - 10);
        }
        let newData = that.parse(res.data);
        if (init) that.lastestLogTime = newData[0].time;
        if (newData[newData.length - 1].time === that.firstDataTime) {
          that.allLoaded = true;
          that.busy = false;
          return;
        }
        that.firstDataTime = newData[newData.length - 1].time;
        that.logs.push(...newData);
        that.sortErrorType(); //统计错误类型
        that.busy = false;
      });
    },
    getLatestLogs() {
      if (this.busy) return;
      this.busy = true;
      var that = this;
      API.chatlog(20).then(res => {
        let newData = that.parse(res.data);
        if (newData[0].time === that.lastestLogTime) {
          that.busy = false;
          return;
        }
        for (let i = 0; i < newData.length; i++) {
          const element = newData[i];
          if (element.time === that.lastestLogTime) {
            // newData.slice(i,)
            newData.splice(i, newData.length - i - 1); //去除已存在的数据
          }
        }
        that.lastestLogTime = newData[0].time;
        // console.log('newData: ', newData);
        that.logs.unshift(...newData);
        that.sortErrorType(); //统计错误类型
        that.busy = false;
      });
    },
    loadMore() {
      if (this.busy) return;
      this.count += 10;
      this.getLogs(this.count);
    },
    sortErrorType() {
      let a = Object.keys(this.types);
      let statisticalArr = [];
      a.forEach(t => {
        statisticalArr.push({
          name: this.typesMap[t],
          times: this.types[t]
        });
      });
      this.statistical = statisticalArr;
    },
    parse(arr) {
      let result = [];
      arr.forEach(element => {
        let lines = element.title.split("\n");
        if (lines.length !== 7) return;
        let log = {};
        lines.forEach(line => {
          if (line.indexOf("微信公众平台报警") === 0) {
            log.appid = line.substr(-18);
          }
          if (line.indexOf("昵称") === 0) {
            log.nickname = line.substr(-line.length + 3).trim();
          }
          if (line.indexOf("时间") === 0) {
            log.time = line.substr(-line.length + 3).trim();
          }
          if (line.indexOf("次数") === 0) {
            log.interval =
              +line
                .substr(-line.length + 3)
                .trim()
                .match(/\d+/g)[1] / 5;
          }
          if (line.indexOf("类型") === 0) {
            log.type = line.substr(-line.length + 3).trim();
          }
          if (line.indexOf("错误样例: ") === 0) {
            log.position = line.substr(-line.length + 5).trim();
            let b64 = md5(log.position);
            if (this.types[b64]) {
              this.types[b64]++;
            } else {
              this.typesMap[b64] = log.position;
              this.types[b64] = 1;
            }
          }
        });
        result.push(log);
      });
      return result;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.table-ctn {
  display: flex;
  /* height: 400px; */
  overflow: auto;
}
</style>
