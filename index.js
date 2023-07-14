// ==UserScript==
// @name         快速创建 Jira 子任务
// @license      MIT
// @version      0.0.5
// @description  一个帮助用户在 Jira 任务页面中快速创建子任务的油猴脚本 / A script to help user creating sub task in Jira task web page.
// @author       Nauxscript
// @match        *jira.gdbyway.com/*
// @run-at       document-end
// @namespace    Nauxscript
// ==/UserScript==

(function () {
  'use strict';
  const hostName = 'http://jira.gdbyway.com'
  const createTaskDialogUrl = '/secure/QuickCreateIssue!default.jspa?decorator=none&parentIssueId='
  const editTaskDialogUrl = '/secure/QuickEditIssue!default.jspa?issueId='
  const baseRequestUrl = `${hostName}${createTaskDialogUrl}`
  const defaultTitlePrefix = '前端：'
  let createSubTaskRequestUrl = '/secure/QuickCreateIssue.jspa?decorator=none'
  let isWaiting = false
  let currTaskInfo = null

  if (!$) {
    throw new Error('have no jquery')
  }

  
  const quickAddSubTaskBtn = createQuickAddBtn();
  const quickEditBtn = createEditBtn();

  $(document).on('ajaxComplete', onRequest)

  window.addEventListener('keyup', async (e) => {
    // const ctrlKey = e.ctrlKey
    const altKey = e.altKey
    // alt + ; = … in mac
    if (altKey && ['…', ';', '；'].includes(e.key)) {
      basicProcess()
    }
    e.preventDefault();
    return false;
  })
  
  function basicProcess() {
    if (isWaiting) {
        return alert('请勿频繁操作')
      }
      const createTaskBtn = document.getElementById('create-subtask')
      const editTaskBtn = document.getElementById('edit-issue') 
      
      if (!createTaskBtn) {
        console.error('当前无法创建子任务');
      }

      if (!editTaskBtn) {
        console.error('无法编辑当前任务');
      }

      if (!createTaskBtn && !editTaskBtn) {
        console.error('无法创建或编辑任务'); 
        return 
      }

      currTaskInfo = getTaskInfo({
        baseRequestUrl,
        defaultTitlePrefix,
      })

      if (!currTaskInfo) {
        return
      }
      isWaiting = true
      if (currTaskInfo.mode === 'c') {
        // create
        if (!createTaskBtn) {
          alert('当前无法创建子任务')
          isWaiting = false
          return
        }

        createTaskBtn.click()
      } else if (currTaskInfo.mode === 'e') {
        // edit
        if (!editTaskBtn) {
          alert('无法编辑当前任务')
          isWaiting = false
          return
        }
        editTaskBtn.click()
      } else {
        isWaiting = false
      }
  }

  function onRequest(event, xhr, setting) {
    if (setting.url === `${createTaskDialogUrl}${currTaskInfo?.parentIssueId}` && isWaiting) {
      console.log('create task dialog open');
      createSubTask(currTaskInfo)
      isWaiting = false
      return
    }

    // edit current task info
    if (setting.url === `${editTaskDialogUrl}${currTaskInfo?.parentIssueId}&decorator=none` && isWaiting) {
      console.log('edit task dialog open');
      // wip
      editTask(currTaskInfo)
      isWaiting
      return
    }

    if (setting.url === createSubTaskRequestUrl && currTaskInfo.autoDone === '1') {
      const parentKey = xhr.responseJSON?.createdIssueDetails?.fields?.parent?.key
      const currSubTaskKey = xhr.responseJSON?.createdIssueDetails?.key
      if (parentKey === currTaskInfo.parentIssueKey) {
        autoDone(currSubTaskKey)
      }
      return
    }
    if (setting.url.includes('AjaxIssueEditAction!default.jspa')) {
      insertOperateBtns()
      console.log('fuck');
    }
  }

  function insertOperateBtns() {
    const createTaskBtn = document.getElementById('create-subtask')
    const editTaskBtn = document.getElementById('edit-issue')   

    if (editTaskBtn) {
      editTaskBtn.parentNode.insertBefore(quickEditBtn, editTaskBtn.nextSibling)
    }

    if (createTaskBtn) { 
      const c = document.getElementById('opsbar-opsbar-transitions')
      if (!c) return 
      c.append(quickAddSubTaskBtn)
    }
  }

  function createEditBtn() {
    const _quickEditBtn = document.createElement('div');
    _quickEditBtn.id = 'quick-edit-btn';
    _quickEditBtn.classList.add('aui-button');
    _quickEditBtn;
    const icon = document.createElement('span');
    icon.className = 'icon aui-icon aui-icon-small aui-iconfont-edit';
    const text = document.createElement('span');
    text.innerText = '快速编辑';
    const todayStr = getCurrDate()

    _quickEditBtn.append(icon);
    _quickEditBtn.append(text);
    _quickEditBtn.addEventListener('click', () => {
      const editTaskBtn = document.getElementById('edit-issue')  
      currTaskInfo = getTaskInfo({
        baseRequestUrl,
        defaultTitlePrefix,
      }, `@${todayStr}@${todayStr}@e@0@`);
      if (!currTaskInfo) {
        return;
      }
      isWaiting = true;
      editTaskBtn.click();
    });
    return _quickEditBtn;
  }

  function createQuickAddBtn() {
    const _quickAddSubTaskBtn = document.createElement('div');
    _quickAddSubTaskBtn.id = 'quick-add-sub-task-btn';
    _quickAddSubTaskBtn.classList.add('aui-button');
    const todayStr = getCurrDate()
    const text = document.createElement('span');
    text.innerText = '快速添加子任务';
    _quickAddSubTaskBtn.append(text);
    _quickAddSubTaskBtn.addEventListener('click', () => {
      const createTaskBtn = document.getElementById('create-subtask')
      currTaskInfo = getTaskInfo({
        baseRequestUrl,
        defaultTitlePrefix,
      }, `@${todayStr}@${todayStr}@c@0@`);
      if (!currTaskInfo) {
        return;
      }
      isWaiting = true;
      createTaskBtn.click();
    });
    return _quickAddSubTaskBtn;
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

  function getTaskInfo(config, defaultStr = '') {
    
    const parentLinkEle = document.getElementById('key-val')
    const parentSummaryEle = document.getElementById('summary-val')
    const parentIssueId = parentLinkEle.getAttribute('rel')
    const parentIssueKey = parentLinkEle.getAttribute('data-issue-key')
    const parentTaskTitle = config.defaultTitlePrefix + parentSummaryEle.innerText
    const todayStr = getCurrDate()
    const inputStr = window.prompt(`
      输入规则:
      ------------
      @<开始时间>@<结束时间>@<c 创建子任务 | e 编辑当前任务>@<是否直接关闭子任务:1 是 | 0 否>@<预估时间>
      ------------
      默认使用当天的日期，创建子任务，不自动关闭；
      不做修改请直接在最后输入预估时间
    `,defaultStr || `@${todayStr}@${todayStr}@c@0@`)
    
    if (!inputStr) {
      isWaiting = false
      console.error('退出创建!');
      return
    }

    const inputInfo = normalizeInput(inputStr)

    const taskInfo = {
      parentTaskTitle,
      targetTime: inputStr,
      parentIssueId,
      parentIssueKey,
      ...inputInfo
    }

    return taskInfo
  }

  function normalizeInput(input) {
    let parseItems = input.split('@')

    // remove first item cause' it is a invalid param
    parseItems.shift()

    parseItems = parseItems.map(item => !item ? '' : item)
    const [startTimeStr, endTimeStr, mode, autoDone, estimateTime] = parseItems

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
    // init mutationObserver to spy on dialog close 
    observerDialog('create-subtask-dialog')

    console.log(baseInfo);

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

  function editTask(baseInfo) {
    // init mutationObserver to spy on dialog close 
    observerDialog('edit-issue-dialog')

    const summaryInput = document.getElementById('summary')
    const targetStartInput = document.getElementById('customfield_10113')
    const targetEndInput = document.getElementById('customfield_10114')
    const originalestimate = document.getElementById('timetracking_originalestimate')
    const remainingestimate = document.getElementById('timetracking_remainingestimate')

    originalestimate.value = baseInfo.estimateTime
    remainingestimate.value = baseInfo.estimateTime
    targetStartInput.value = baseInfo.startTime
    targetEndInput.value = baseInfo.endTime
    summaryInput.focus()
  }

  function observerDialog(id) {
    const dialogContainer = document.getElementById(id)
    if (!dialogContainer) return
    // 创建一个观察器实例并传入回调函数
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.removedNodes) {
          for (let i = 0; i < mutation.removedNodes.length; i++) {
            if (mutation.removedNodes[i] === dialogContainer) {
              console.log('Node removed!');
              observer.disconnect();  // 如果节点被移除，停止观察
              isWaiting = false
            }
          }
        }
      });    
    });

    // 配置观察选项:
    const config = { attributes: true, childList: true, subtree: true };

    // 传入目标节点和观察选项
    observer.observe(document.body, config);
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