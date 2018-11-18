<template>
  <div class="home-ctn clearfix">
    <h1>{{header.title}}</h1>
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
import { Base64 } from "js-base64";
// let Base64 = require('js-base64').Base64;
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
      firstDataTime: null
    };
  },
  created() {
    this.getLogs(this.count, true);
  },
  methods: {
    getLogs(count, init) {
      if (this.busy) return;
      this.busy = true;
      axios
        .get("/api/chatlog", {
          headers: {
            "Access-Control-Allow-Origin": "*"
          },
          params: {
            userId: "3051726979@chatroom",
            count: count || this.count
          }
        })
        .then(res => {
          if (init) {
            this.header = res.data.splice(0, 1)[0];
          } else {
            /* 只处理最后10条数据 */
            res.data.splice(0, res.data.length - 10);
          }
          let newData = this.parse(res.data);
          if (newData[newData.length - 1].time === this.firstDataTime) {
            this.allLoaded = true;
            this.busy = false;
            return;
          }
          this.firstDataTime = newData[newData.length - 1].time;
          this.logs.push(...newData);
          this.sortErrorType(); //统计错误类型
          this.busy = false;
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
            let b64 = Base64.encode(log.position);
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
