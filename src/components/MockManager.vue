<script lang="ts" setup>
  import { reactive, Ref, ref } from 'vue';
  import type { FormInstance } from 'element-plus'

  interface PortDef {
    started: boolean,
    port: number,
    paths: string[],
  }
  interface Delay {
    timeUnit: string,
    value: number,
  }
  interface TypeBody {
    type: string,
    xml: string,
    rawBytes: string,
    json: string,
    content: string,
    matchType: string,
  }
  interface HttpRequest {
    body: TypeBody | any,
    cookies: any | string[],
    headers: Map<string, string[]> | string[],
    method: string,
    path: string,
  }
  interface HttpResponse {
    body: any,
    cookies: any | string[],
    headers: Map<string, []> | string[],
    method: string,
    path: string,
    delay: Delay,
  }
  interface Mock {
    httpRequest: HttpRequest
    httpResponse: HttpResponse,
    id: string,
    priority: number,
    timeToLive: any
    times: any
  }

  const newmock = () => {
    return {httpRequest: {body: {}, headers: [], cookies: []}, httpResponse: {body: {}, headers: [], cookies: []}};
  }
  const testmock: Ref<Mock> = ref(newmock());
  const mock: Ref<Mock> = ref();
  const newPort = ref();
  const port = ref();
  const tableData: Ref<Mock[]> = ref([]);
  const sumTable: Ref<PortDef[]> = ref([]);
  const drawer = ref(false);
  const testdrawer = ref(false);
  const alertMsg = ref("提示");
  const showAlert = ref(false);
  function json(url: string, req: any, method: string) {
      return fetch(url, {
          "headers": {
              "accept": "*/*",
              "content-type": "application/json;charset=UTF-8",
          },
          "body": req? JSON.stringify(req): req,
          "method": method
      })
  }
  function putjson(url: string, req: any) {
      return json(url, req, "PUT").then(r => r.json());
  }
  function postjson(url: string, req: any) {
      return json(url, req, "POST").then(r => r.json());
  }
  function getjson(url: string, req: any) {
      return json(url, req, "GET").then(r => r.json());
  }
  const load = async function () {
    loadPort().then(x => {
      for (let index = 0; index < sumTable.value.length; index++) {
        const element = sumTable.value[index];
        if (element.started) {
          port.value = element.port;
          loadPortDetails(port.value);
          break;
        }
        
      }
    })
  }
  const loadPort = async function() {
    sumTable.value = (await getjson("//localhost:30456/mock/list", null)).body;
  }
  const loadPortDetails = async function(port: number) {
    tableData.value = toForm(await putjson("//localhost:"+port+"/mockserver/retrieve?type=ACTIVE_EXPECTATIONS", {}));
  }

  const start = async (port: number) => {
    let a = await postjson("//localhost:30456/mock/create?port="+port, {});
    if (a.code == 200) {
      myAlert("加载成功");
      load();
    }
  }

  const stop = async (port: number) => {
    let a = await postjson("//localhost:30456/mock/stop?port="+port, {});
    if (a.code == 200) {
      myAlert("加载成功");
      load();
    }
  }
  const change = async function (aport: number) {
    port.value = aport;
    loadPortDetails(port.value);
  }
  const clone = (a: any) => JSON.parse(JSON.stringify(a));

  function myAlert(msg: string) {
    alertMsg.value = msg;
    showAlert.value = true;
    setTimeout(() => {
      showAlert.value = false;
    }, 2000);
  };
  const toForm = (mock2: Mock[]) => {
    mock2.forEach(m => {
      if (m.httpRequest.headers) {
        m.httpRequest.headers = Object.keys(m.httpRequest.headers).flatMap(k => m.httpRequest.headers[k].map(a => [k, a])); 
      } else {
        m.httpRequest.headers = [];
      }
      if (m.httpRequest.cookies) {
        m.httpRequest.cookies = Object.keys(m.httpRequest.cookies).map(k => [k, m.httpRequest.cookies[k]]);
      } else {
        m.httpRequest.cookies = [];
      }
      if (m.httpResponse.headers) {
        m.httpResponse.headers = Object.keys(m.httpResponse.headers).flatMap(k => m.httpResponse.headers[k].map(a => [k, a])); 
      } else {
        m.httpResponse.headers = [];
      }
      if (m.httpResponse.cookies) {
        m.httpResponse.cookies = Object.keys(m.httpResponse.cookies).map(k => [k, m.httpResponse.cookies[k]]);
      } else {
        m.httpResponse.cookies = [];
      }
      let body = m.httpRequest.body;
      if (body) {
        if (!body.type) { 
          m.httpRequest.body = {
            type: "JSON",
            content: JSON.stringify(body),
            matchType: "ONLY_MATCHING_FIELDS",
          }
        } else {
          m.httpRequest.body = {
            type: body.type,
            content: body.xml || JSON.stringify(body.json),
            matchType: body.matchType,
          }
        }
      } else {
        m.httpRequest.body = {
          type: "",
        }
      }
      body = m.httpResponse.body;
      if (body) {
        if (!body.type) { 
          m.httpResponse.body = {
            type: "JSON",
            content: JSON.stringify(body),
            matchType: "ONLY_MATCHING_FIELDS",
          }
        } else {
          m.httpResponse.body = {
            type: body.type,
            content: body.xml || JSON.stringify(body.json),
            matchType: body.matchType,
          }
        }
      } else {
        m.httpResponse.body = {
          type: "",
        }
      }
    })
    console.log({mock2});
    return mock2;
  }
  const reForm = (m: Mock) => {
    let h: any = {};
    m.priority = Number(m.priority);
    delete m.httpRequest.rawBytes;
    delete m.httpResponse.rawBytes;
    m.httpRequest.headers.forEach(e => {
      h[e[0]] = h[e[0]] || [];
      h[e[0]].push(e[1]);
    });
    m.httpRequest.headers = h;
    h = {};
    m.httpResponse.headers.forEach(e => {
      h[e[0]] = h[e[0]] || [];
      h[e[0]].push(e[1]);
    });
    m.httpResponse.headers = h;
    h = {};
    m.httpRequest.cookies.forEach(e => {
      h[e[0]] = e[1];
    });
    m.httpRequest.cookies = h;
    h = {};
    m.httpResponse.cookies.forEach(e => {
      h[e[0]] = e[1];
    });
    m.httpResponse.cookies = h;
    let body = m.httpRequest.body;
    if(body) {
      if (body.type == 'XML') {
        m.httpRequest.body = {
          type: body.type,
          xml: body.content,
        }
      } else if (body.type == 'JSON') {
        m.httpRequest.body = {
          type: body.type,
          json: JSON.parse(body.content),
          matchType: body.matchType
        }
      } else {
        delete m.httpRequest.body;
      }
    }
    body = m.httpResponse.body;
    if(body) {
      if (body.type == 'XML') {
        m.httpResponse.body = {
          type: body.type,
          xml: body.content,
        }
      } else if (body.type == 'JSON') {
        m.httpResponse.body = {
          type: body.type,
          json: JSON.parse(body.content),
        }
      } else {
        delete m.httpRequest.body;
      }
    }
    // deleteNull(m);
    m.timeToLive={unlimited: true};
    m.times={unlimited: true};
    console.log({m});
    return m;
  }
  const deleteNull = (a: any) => {
    Object.keys(a).forEach(x => {
      if(a[x] && Object.keys(a[x]).length) {
        if(typeof a[x] == 'object') {deleteNull(a[x])}
      } else {
        delete a[x]
      }
    })
  }
  const del = function (mock2: Mock){
    putjson("//localhost:" + port.value + "/mockserver/expectation", {
      id: mock2.id,
      httpResponse:{},
      httpRequest:{},
      timeToLive: {timeToLive: 0, unlimited: false},
      times: {remainingTimes: 0},
    })
    .then(x => {
      myAlert(x.body)
      load();
    });
  }
  const save = async function (mock2: Mock){
    let valid = await mockFormRef.value.validate((valid, fields) => {
      if (valid) {
        console.log('submit!')
      } else {
        console.log('error submit!', fields)
      }
      return valid;
    });

    if (valid) {
      putjson("//localhost:" + port.value + "/mockserver/expectation", reForm(clone(mock2)))
      .then(x => {
        myAlert(x.body)
        load();
      });
    }

  }
  const send = (mock2: Mock) => {
    let a = {
      method: mock2.httpRequest.method,
      headers: mock2.httpRequest.headers.reduce((a, b) => {a[b[0]] = b[1];return a;}, {}),
      body: mock2.httpRequest.body.content,
    };
    if(a.method == 'GET' || a.method == 'HEAD') {
      delete a.body;
    }
    fetch("//localhost:" + port.value + mock2.httpRequest.path.replace(/^([^/])/, "/$1"), a).then(async x => {
      mock2.httpResponse.headers = x.headers;
      mock2.httpResponse.status = x.status;
      mock2.httpResponse.body = await x.text();
    })
  }
  const usetest = (mock2: Mock) => {
    let a = clone(mock2);
    a.httpResponse = {headers: []};
    testmock.value = a;
    testdrawer.value = true;
  }
  load();
  const allMoethdsName = (queryString: string, cb: any) => {
    let methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "TRACE"].map(x => {return {value: x};});
    cb(queryString?methods.filter(x => x.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0):methods);
  }
  const allheadersName = (queryString: string, cb: any) => {
    let methods = ["Accept","Accept-Charset", "Accept-Encoding", "Accept-Language", "Accept-Patch", "Accept-Ranges", "Access-Control-Allow-Credentials",
"Access-Control-Allow-Headers", "Access-Control-Allow-Methods", "Access-Control-Allow-Origin", "Access-Control-Expose-Headers",
"Access-Control-Max-Age", "Access-Control-Request-Headers", "Access-Control-Request-Method", "Age", "Allow", "Authorization", "Content-Type",
"Cache-Control", "Connection", "Content-Encoding", "Content-Disposition", "Content-Language", "Content-Length", "Content-Location",
"Content-Range", "Cookie", "Date", "ETag", "Expect", "Expires", "From", "Host", "If-Match", "If-Modified-Since",
"If-None-Match", "If-Range", "If-Unmodified-Since", "Last-Modified", "Link", "Location", "Max-Forwards", "Origin", "Pragma",
"Proxy-Authenticate","Proxy-Authorization", "Range", "Referer", "Retry-After", "Server", "Set-Cookie", "Set-Cookie2", "TE", "Trailer",
"Transfer-Encoding", "Upgrade", "User-Agent", "Vary", "Via", "Warning", "WWW-Authenticate"].map(x => {return {value: x}});
    cb(queryString?methods.filter(x => x.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0):[]);
  }

  const validateNotEmpty = (rule: any, value: any, callback: any, source: any, options: any) => {
    if (!value && value !== 0) {
      callback(new Error('不能为空'));
    }else {
      callback();
    }
  }
  
  const mockFormRef = ref<FormInstance>()
  const rules = reactive({
    priority: [{ validator: validateNotEmpty, trigger: 'blur' }],
  })

</script>


<template>
  <el-alert :title="alertMsg" type="success" v-if="showAlert" style="position: absolute; left: 30%; z-index: 2;"/>

  <el-drawer
    title="新增应用"
    v-model="drawer"
    direction="ltr">
    <el-form>
      <el-input v-model="newPort"></el-input>
    </el-form>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="drawer=false">取消</el-button>
        <el-button type="primary" @click="start(newPort);load();drawer=false;">确定</el-button>
      </div>
    </template>
  </el-drawer>

  <el-drawer
    title="测试"
    v-model="testdrawer"
    direction="rtl">
    <el-form :model="testmock" label-width="120px" v-if="testmock">
      <el-form-item label="path">
          <el-col :span="8">
            <el-autocomplete v-model="testmock.httpRequest.method" :fetch-suggestions="allMoethdsName"/>
          </el-col>
          <el-col :span="1"></el-col>
          <el-col :span="15">
            <el-input v-model="testmock.httpRequest.path" required/>
          </el-col>
      </el-form-item>
      <el-form-item label="headers">
        <el-space direction="vertical">
          <el-space  v-for="(h, i) in testmock.httpRequest.headers" :key="h">
            <el-autocomplete v-model="h[0]" :fetch-suggestions="allheadersName"/>
            <el-input v-model="h[1]" />
            <el-button type="danger" @click="testmock.httpRequest.headers.splice(i, 1)">-</el-button>
          </el-space>
        </el-space>
        <el-button @click="testmock.httpRequest.headers.push(['', ''])">+</el-button>
      </el-form-item>
      <el-form-item label="body">
        <el-input type="textarea" v-model="testmock.httpRequest.body.content"/>
      </el-form-item>
      <el-divider />
      <el-form-item label="response">
        {{testmock.httpResponse}}
      </el-form-item>
      <el-form-item>
        <el-button @click="send(testmock)">发送</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>

  <el-container>
      <el-aside width="160px">
        <el-space direction="vertical">
          <el-button @click="drawer=true" type="primary">新增应用</el-button>
          <el-button @click="mock = newmock()">新增接口</el-button>
          <el-button @click="testdrawer=true" type="info">接口测试</el-button>
          <!-- //<el-button @click="load">刷新</el-button> -->
        </el-space>
        <el-divider />
        <el-space direction="vertical">
          <el-card v-for="s in sumTable" :key="s" :shadow="s.port==port?'always':'never'" @click="if(s.started && port != s.port) {change(s.port)};">
            <template #header>
              {{s.port}}
            </template>
            <el-space direction="vertical">
              <el-button type="primary" @click="start(s.port)" v-if="!s.started">启动</el-button>
              <el-button type="danger" @click="stop(s.port)" v-if="s.started">停止</el-button>
              <el-button type="info" disabled>Eureka注册</el-button>
            </el-space>
          </el-card>
          </el-space>
      </el-aside>
      <el-container>
        <el-header height="150px" width="100%" style="overflow: auto">
          <el-table :data="tableData" style="width: 100%">
            <el-table-column label="操作">
              <template #default="it">
                <el-button @click="mock=it.row" type="primary">编辑</el-button>
                <el-button @click="del(it.row)" type="danger">删除</el-button>
                <el-button @click="usetest(it.row)" type="info">测试</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="id"/>
            <el-table-column prop="priority" label="优先级"/>
            <el-table-column label="请求">
              <template #default="it">
                {{it.row.httpRequest.method}} {{it.row.httpRequest.path}}
              </template>
            </el-table-column>
          </el-table>
        </el-header>
            <el-form :model="mock" ref="mockFormRef" :rules="rules" label-width="100px" v-if="mock" status-icon>
        <el-container>
          <el-main>
              <el-form-item label="id">
                <el-input v-model="mock.id" disabled/>
              </el-form-item>
              <el-form-item label="优先级" prop="priority">
                <el-input v-model.number="mock.priority" />
              </el-form-item>
              <el-form-item label="方法" prop="httpRequest.method" :rules="rules.priority">
                <el-autocomplete v-model="mock.httpRequest.method" :fetch-suggestions="allMoethdsName"/>
              </el-form-item>
              <el-form-item label="路径" prop="httpRequest.path" :rules="rules.priority">
                <el-input v-model="mock.httpRequest.path"/>
              </el-form-item>
              <el-form-item label="请求头" >
                <el-space direction="vertical">
                  <el-space  v-for="(h, i) in mock.httpRequest.headers" :key="h">
                    <el-form-item label="" :prop="'httpRequest.headers['+i+'][0]'" :rules="rules.priority">
                      <el-autocomplete v-model="h[0]" :fetch-suggestions="allheadersName"/>
                    </el-form-item>
                    <el-form-item label="" :prop="'httpRequest.headers['+i+'][1]'" :rules="rules.priority">
                      <el-input v-model="h[1]" />
                    </el-form-item>
                    <el-button type="danger" @click="mock.httpRequest.headers.splice(i, 1)">-</el-button>
                  </el-space>
                </el-space>
                <el-button @click="mock.httpRequest.headers.push(['', ''])">+</el-button>
              </el-form-item>
              <el-form-item label="cookies">
                <el-space direction="vertical">
                  <el-space v-for="(h, i) in mock.httpRequest.cookies" :key="h">
                    <el-form-item label="" :prop="'httpRequest.cookies['+i+'][0]'" :rules="rules.priority">
                      <el-input v-model="h[0]" />
                    </el-form-item>
                    <el-form-item label="" :prop="'httpRequest.cookies['+i+'][1]'" :rules="rules.priority">
                      <el-input v-model="h[1]" />
                    </el-form-item>
                    <el-button type="danger" @click="mock.httpRequest.cookies.splice(i, 1)">-</el-button>
                  </el-space>
                </el-space>
                <el-button @click="mock.httpRequest.cookies.push(['', ''])">+</el-button>
              </el-form-item>
              <el-form-item label="报文匹配">
                <el-select v-model="mock.httpRequest.body.type">
                  <el-option key="JSON" label="JSON" value="JSON" />
                  <el-option key="XML" label="XML" value="XML" />
                  <el-option key="" label="不匹配" value="" />
                </el-select>
              </el-form-item>
              <el-form-item :label="mock.httpRequest.body.type" v-if="mock.httpRequest.body.type">
                <el-input type="textarea" v-model="mock.httpRequest.body.content"/>
                <el-select v-model="mock.httpRequest.body.matchType" v-if="mock.httpRequest.body.type=='JSON'">
                  <el-option key="ONLY_MATCHING_FIELDS" label="ONLY_MATCHING_FIELDS" value="ONLY_MATCHING_FIELDS" />
                  <el-option key="STRICT" label="STRICT" value="STRICT" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button @click="save(mock)">保存</el-button>
              </el-form-item>
          </el-main>
          <el-main>
              <el-form-item label="headers">
                <el-space direction="vertical">
                  <el-space  v-for="(h, i) in mock.httpResponse.headers" :key="h">
                    <el-form-item label="" :prop="'httpResponse.headers['+i+'][0]'" :rules="rules.priority">
                      <el-autocomplete v-model="h[0]" :fetch-suggestions="allheadersName"/>
                    </el-form-item>
                    <el-form-item label="" :prop="'httpResponse.headers['+i+'][1]'" :rules="rules.priority">
                      <el-input v-model="h[1]" />
                    </el-form-item>
                    <el-button type="danger" @click="mock.httpResponse.headers.splice(i, 1)">-</el-button>
                  </el-space>
                </el-space>
                <el-button @click="mock.httpResponse.headers.push(['', ''])">+</el-button>
              </el-form-item>
              <el-form-item label="cookies">
                <el-space direction="vertical">
                  <el-space v-for="(h, i) in mock.httpResponse.cookies" :key="h">
                    <el-form-item label="" :prop="'httpResponse.cookies['+i+'][0]'" :rules="rules.priority">
                      <el-input v-model="h[0]" />
                    </el-form-item>
                    <el-form-item label="" :prop="'httpResponse.cookies['+i+'][1]'" :rules="rules.priority">
                      <el-input v-model="h[1]" />
                    </el-form-item>
                    <el-button type="danger" @click="mock.httpResponse.cookies.splice(i, 1)">-</el-button>
                  </el-space>
                </el-space>
                <el-button @click="mock.httpResponse.cookies.push(['', ''])">+</el-button>
              </el-form-item>
              <el-form-item label="返回格式">
                <el-select v-model="mock.httpResponse.body.type">
                  <el-option key="JSON" label="JSON" value="JSON" />
                  <el-option key="XML" label="XML" value="XML" />
                </el-select>
              </el-form-item>
              <el-form-item :label="mock.httpResponse.body.type" v-if="mock.httpResponse.body.type">
                <el-input type="textarea" v-model="mock.httpResponse.body.content"/>
              </el-form-item>
          </el-main>
        </el-container>
        </el-form>
      </el-container>
    </el-container>
  
</template>