// ==UserScript==
// @name         快速创建 Jira 子任务
// @namespace    https://nauxscript.com
// @version      0.0.1
// @description  一个帮助用户在 Jira 任务页面中快速创建子任务的油猴脚本 / A script to help user creating sub task in Jira task web page.
// @author       Nauxscript
// @homepage     https://github.com/Nauxscript-dev/jira-subtask-quick-creator
// @match        *jira.gdbyway.com/*
// @match        http://jira.gdbyway.com/secure/QuickCreateIssue!default.jspa*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=juejin.cn
// @grant        GM_webRequest
// @run-at       document-end
// @updateURL    https://github.com/Nauxscript-dev/jira-subtask-quick-creator/index.js
// @downloadURL    https://github.com/Nauxscript-dev/jira-subtask-quick-creator/index.js
// ==/UserScript==

(function(){
  'use strict';
  const baseRequestUrl = 'http://jira.gdbyway.com/secure/QuickCreateIssue!default.jspa?decorator=none&parentIssueId='
  const defaultTitlePrefix = '前端：'
  let isWaiting = false

  // GM_webRequest([
    //   { selector: 'http://jira.gdbyway.com/secure/QuickCreateIssue!default.jspa*', action: { redirect: { from: "(.*)", to: "$1" } } },
    // ], function (info, message, details) {
  //   console.log(info, message, details);
  // });

  window.addEventListener('keyup' , (e) => {
    // const ctrlKey = e.ctrlKey
    const altKey = e.altKey
    // alt + ; = … in mac
    if (altKey && e.key === "…") {
      console.log(location.href)
      if (!location.pathname.includes('/browse/')) return
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

  function getTaskInfo(config) {
    const targetTime = window.prompt('请填入子任务时间')

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

  function getCurrDate() {
    const now = new Date();
    const year = now.getFullYear();
    let month = now.getMonth() + 1;
    let date = now.getDate();
    if (month < 10) month = '0' + month;
    if (date < 10) date = '0' + date;
    const formattedDate = year + '-' + month + '-' + date;
    return formattedDate
  }

  function afterDialogOpen(baseInfo) {
    const summaryInput = document.getElementById('summary')
    const targetStartInput = document.getElementById('customfield_10113')
    const targetEndInput = document.getElementById('customfield_10114')
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
      if (elapsedTime >= 60000) { // 60000 ms = 1 minute
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