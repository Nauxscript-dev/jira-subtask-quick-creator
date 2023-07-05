# jira-subtask-quick-creator

一个帮助用户在 Jira 任务页面中快速创建子任务的油猴脚本 
A script to help user creating sub task in Jira task web page.

专治所谓工时登记要求创建子任务并填入预估工时。

## Install

## Setup

## Usage

默认注入快捷键 `option ⌥` + `;` / `；` (兼容中文输入法状态)，唤起弹窗输入工时（请输入 Jira 支持的时间格式，如 `1w 2d 3h 4m` 之类的，也可以单输入数字，Jira 默认会转为小时，如输入 `2` 会转为 `2h`），输入点击确定，则会弹出创建子任务的弹窗并自动填充标题、初始/剩余预估（默认带入前面输入的工时），目标起始/结束日期（默认今天），经办人默认分配给自己，概要默认使用父任务的标题并加上默认的前缀。