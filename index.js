(function(){
  'use strict';
  const baseRequestUrl = 'http://jira.gdbyway.com/secure/QuickCreateIssue!default.jspa?decorator=none&parentIssueId='
  const defaultTitlePrefix = '前端：'

  let isWaiting = false

  function getTaskInfo(config) {
    const targetTime =  window.prompt('请填入子任务时间')
    
    const parentLinkEle = document.getElementById('key-val')
    const parentSummaryEle = document.getElementById('summary-val')
    const parentIssueId = parentLinkEle.getAttribute('rel')
    const parentTaskTitle = config.defaultTitlePrefix + parentSummaryEle.innerText
    const fullUrl = config.baseRequestUrl + parentIssueId 
    const todayStr = getCurrDate()

    const taskInfo = {
      fullUrl,
      parentTaskTitle,
      todayStr,
      targetTime
    }

    return taskInfo
  }

  window.addEventListener('keyup' , (e) => {
    // const ctrlKey = e.ctrlKey
    const altKey = e.altKey
    // alt + ; = … in mac
    if (altKey && e.key === "…") {

      if (isWaiting) {
        return alert('请勿频繁操作') 
      }
      const createTaskBtn = document.getElementById('create-subtask')
      if (!createTaskBtn) {
        return alert("当前无法创建子任务")
      }

      const baseInfo = getTaskInfo({
        baseRequestUrl,
        defaultTitlePrefix
      })

      if (baseInfo.targetTime === null) {
        console.error('退出创建!');
        return
      }
      
      console.log(baseInfo.fullUrl)
      const beforeLen = performance.getEntriesByName(baseInfo.fullUrl).length
      createTaskBtn.click()

      isWaiting = true
      checkRequestDone(baseInfo.fullUrl, beforeLen).then((msg) => {
        console.log(msg)
        isWaiting = false
        afterDialogOpen(baseInfo)
      }).catch((err) => {
        console.error(err);
      })
      

      return;
      const time =  window.prompt('请填入子任务时间')
      if (time === null) {
        return
      }
      const parentKey = document.getElementById('key-val').getAttribute('data-issue-key')
      const assignee = getCurrUserInfo()
      if (!parentKey || !parentIssueId) {
        return alert('父任务不存在')
      }
      const matche = parentKey.match(/(.*?)-\d+/)
      if (!matche) {
        return alert('项目不存在')
      }
      const projectKey = matche[1]
    

      const todayStr = getCurrDate()
      const params = {
        fields:{ 
          project: { 
            key: projectKey
          }, 
          parent: { 
            key:  parentKey,
            id: parentIssueId
          }, 
          summary: parentTaskTitle, 
          description: "???", 
          issuetype: { 
            subtask: true,
            name: '子任务',
            id: '10500'
          },
          assignee,
          timetracking: {
            originalEstimate: time,
            remainingEstimate: time
          },
          // 开始日期
          customfield_10113: todayStr,
          // 结束日期
          customfield_10114: todayStr
        }
      } 
      const flag = alert('确定创建？')
      flag && post(JSON.stringify(params)).then((res) => {
        console.log(res)
      })
    }
    e.preventDefault();
    return false;
  })

  const promiseHelper = () => {
    let _resolve, _reject
    const p = new Promise((resolve, reject)=> {
      _resolve = resolve
      _reject = reject
    })
    return {
      p,
      _resolve,
      _reject
    }
  }

  function post(param) {
    const { p, _resolve, _reject } = promiseHelper()
    var xhr = new XMLHttpRequest(),
      method = "POST",
      url = "http://jira.gdbyway.com/rest/api/2/issue/";
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText);
            console.log(json);
            _resolve(json)
          } else {
            console.error('Error: ' + xhr.status);
            console.error('Response: ' + xhr.responseText);
            _reject(xhr.responseText)
          }
        }
      }
    }; 
    xhr.send(param)
    return p
  }

  function getCurrDate() {
    const now = new Date();
    const year = now.getFullYear();
    let month = now.getMonth() + 1; // getMonth() 返回的月份从0开始，所以需要+1
    let date = now.getDate();
    
    // 如果月份或日期小于10，前面补0
    if (month < 10) month = '0' + month;
    if (date < 10) date = '0' + date;
    
    const formattedDate = year + '-' + month + '-' + date;
    
    return formattedDate  
  }

  function getCurrUserInfo() {
    const ele = document.getElementById('header-details-user-fullname')
    if (!ele) {
      throw new Error('No User Info!')
    }

    const imgEle = ele.querySelector('img')
    if (!imgEle) {
      throw new Error('No User Image Info!')
    }

    const urlObj = new URL(imgEle.src || '')
    const key = urlObj.searchParams.get('ownerId')
    const displayName = ele.getAttribute('data-displayname')
    const name = ele.getAttribute('data-username')
    
    return {
      key,
      displayName,
      name
    }
  }

  function afterDialogOpen(baseInfo) {
    const summaryInput = document.getElementById('summary')
    const targetStartInput = document.getElementById('customfield_10113')
    const targetEndInput = document.getElementById('customfield_10113')
    const assignToMeBtn = document.getElementById('assign-to-me-trigger')
    const originalestimate = document.getElementById('timetracking_originalestimate')
    const remainingestimate = document.getElementById('timetracking_remainingestimate')

    summaryInput.value = baseInfo.parentTaskTitle
    originalestimate.value = baseInfo.targetTime
    remainingestimate.value = baseInfo.targetTime
    targetStartInput.value = baseInfo.todayStr
    targetEndInput.value = baseInfo.todayStr
    assignToMeBtn.click()
  }

  function checkRequestDone(fullUrl, beforeLen) {
    const { p, _resolve, _reject } = promiseHelper()
    let startTime = Date.now();
    const timer = setInterval(() => {
      let elapsedTime = Date.now() - startTime;
      if (elapsedTime >= 60000) {  // 60000 ms = 1 minute
        clearInterval(timer);
        _reject('One minute has passed. Stopping the timer.')
        return
      }
      console.log('waiting...')
      const newLen = performance.getEntriesByName(fullUrl).length
      if (newLen > beforeLen) {
        clearInterval(timer) 
        _resolve('done')
      }
    }, 500)
    return p
  } 

})()
