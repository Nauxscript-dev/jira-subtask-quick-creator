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

(function () {
  'use strict';
  const hostName = 'http://jira.gdbyway.com'
  const dialogUrl = '/secure/QuickCreateIssue!default.jspa?decorator=none&parentIssueId='
  const baseRequestUrl = `${hostName}${dialogUrl}`
  const defaultTitlePrefix = '前端：'
  let createSubTaskRequestUrl = '/secure/QuickCreateIssue.jspa?decorator=none'
  let isWaiting = false
  let currTaskInfo = null

  if (!$) {
    throw new Error('have no jquery')
  }

  $(document).on('ajaxComplete', onRequest)

  window.addEventListener('keyup', async (e) => {
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

      currTaskInfo = getTaskInfo({
        baseRequestUrl,
        defaultTitlePrefix,
      })

      if (currTaskInfo.targetTime === null) {
        console.error('退出创建!');
        return
      }

      isWaiting = true
      createTaskBtn.click()
    }
    e.preventDefault();
    return false;
  })
  

  function onRequest(event, xhr, setting) {
    if (setting.url === `${dialogUrl}${currTaskInfo.parentIssueId}` && isWaiting) {
      console.log('dialog open');
      createSubTask(currTaskInfo)
      isWaiting = false
    }

    if (setting.url === createSubTaskRequestUrl) {
    if (setting.url === createSubTaskRequestUrl && currTaskInfo.autoDone === '1') {
      const parentKey = xhr.responseJSON?.createdIssueDetails?.fields?.parent?.key
      const currSubTaskKey = xhr.responseJSON?.createdIssueDetails?.key
      if (parentKey === currTaskInfo.parentIssueKey) {
        autoDone(currSubTaskKey)        
      }
    }
  }

  const promiseHelper = () => {
    let _resolve, _reject
    const p = new Promise((resolve, reject) => {
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
    
    const parentLinkEle = document.getElementById('key-val')
    const parentSummaryEle = document.getElementById('summary-val')
    const parentIssueId = parentLinkEle.getAttribute('rel')
    const parentIssueKey = parentLinkEle.getAttribute('data-issue-key')
    const parentTaskTitle = config.defaultTitlePrefix + parentSummaryEle.innerText
    const fullUrl = config.baseRequestUrl + parentIssueId
    const todayStr = getCurrDate()

    const inputStr = window.prompt(`
      输入规则:
      ------------
      @<开始时间>@<结束时间>@<c 创建子任务 | e 编辑当前任务>@<是否直接关闭子任务:1 是 | 0 否>@<预估时间>
      ------------
      默认使用当天的日期，创建子任务，不自动关闭；
      不做修改请直接在最后输入预估时间
    `,`@${todayStr}@${todayStr}@c@0@`)

    inputInfo = normalizeInput()

    const taskInfo = {
      fullUrl,
      parentTaskTitle,
      targetTime: inputStr,
      parentIssueId,
      parentIssueKey,
      ...inputInfo
    }

    return taskInfo
  }

  function normalizeInput(input) {
    const [startTimeStr, endTimeStr, mode, autoDone, estimateTime] = input.split('@');

    if (!['c', 'e'].includes(mode)) {
      throw new Error('Invalid mode');
    }

    if (!['0', '1'].includes(autoDone)) {
      throw new Error('Invalid autodone');
    } 

    return {
      mode,
      autoDone,
      estimateTime,
      startTime: startTimeStr.replace(/\s+/g, ''),
      endTime: endTimeStr.replace(/\s+/g, ''),
    };
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

  function createSubTask(baseInfo) {
    const summaryInput = document.getElementById('summary')
    const targetStartInput = document.getElementById('customfield_10113')
    const targetEndInput = document.getElementById('customfield_10114')
    const assignToMeBtn = document.getElementById('assign-to-me-trigger')
    const originalestimate = document.getElementById('timetracking_originalestimate')
    const remainingestimate = document.getElementById('timetracking_remainingestimate')

    summaryInput.value = baseInfo.parentTaskTitle
    originalestimate.value = baseInfo.estimateTime
    remainingestimate.value = baseInfo.estimateTime
    targetStartInput.value = baseInfo.startTime
    targetEndInput.value = baseInfo.endTime
    assignToMeBtn.click()
    summaryInput.focus()
  }

  async function autoDone(issueKey) {
    if (!issueKey) return
    const closeTransitionId = await getTaskTransitions(issueKey)
    if (!closeTransitionId) {
      console.error(`子任务【${issueKey}】无法自动关闭`);
      return
    }
    await sendRequest(`issue/${issueKey}/transitions`, 'POST', {
      transition: {
        id: closeTransitionId
      },
      fields: {
        resolution: {
          name: 'Done'
        }
      }
    })
    location.reload(true)
  }

  async function getTaskTransitions(issueKey) {
    const url = `issue/${issueKey}/transitions?expand=transitions.fields`
    const res = await sendRequest(url)
    if (res && res.transitions && res.transitions.length) {
      const transition = res.transitions.find(t => t.name === '关闭任务')
      return transition.id
    }
  }

  function sendRequest(api, method = 'GET', param) {
    const { p, _resolve, _reject } = promiseHelper()
    var xhr = new XMLHttpRequest(),
      url = `${hostName}/rest/api/2/${api}`;
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            let json
            if (xhr.responseText) {
              json = JSON.parse(xhr.responseText);
              console.log(json);
            }
            _resolve(json || xhr.responseText)
          } else {
            console.error('Error: ' + xhr.status);
            console.error('Response: ' + xhr.responseText);
            _reject(xhr.responseText)
          }
        }
      }
    };
    xhr.onerror = function (err) {
      _reject(err)
    };
    xhr.send(param ? JSON.stringify(param) : undefined)
    return p
  }
})()