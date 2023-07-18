# jira-subtask-quick-creator

一个帮助用户在 Jira 任务页面中快速创建子任务的油猴脚本。
A script to help user creating sub task in Jira task web page.

专治所谓工时登记要求创建子任务并填入预估工时，不仅节省你的生命，还对工作的烦躁有一定的缓解作用。

## Install

⚠️注意：安装该脚本前请先安装[**篡改猴（即油猴）**](https://www.tampermonkey.net/)插件，该插件可通过 chrome 插件商店（需代理）或 [篡改猴官网](https://www.tampermonkey.net/)下载。

安装本脚本有以下两种方法：

1. 通过 [Greasy Fork](https://greasyfork.org/zh-CN/scripts/470730-%E5%BF%AB%E9%80%9F%E5%88%9B%E5%BB%BA-jira-%E5%AD%90%E4%BB%BB%E5%8A%A1) 安装，后续更新更方便（推荐）；
2. 在篡改猴插件中新建脚本，把 [该脚本内容](./index.js) 复制进去，保存，启用。

## Setup

## Usage

### 快捷键及页面按扭

- MacOS: `option ⌥` + `;`
- Window: `alt` + `;`
- 注入页面 `快速编辑` 按钮
- 注入页面 `快速编辑子任务` 按钮

通过快捷键或注入按钮唤起弹窗输入命令进行一系列为了登记公司的操作。

### 输入规则

`@<开始时间>@<结束时间>@<模式>@<创建后关闭>@<预估时间>`;

- 开始时间：即 `Target start` 的值，任务开始时间，格式为 `xxxx-xx-xx`，可以自行修改为所需时间
- 结束时间：即 `Target end` 的值，任务结束时间，格式为 `xxxx-xx-xx`，可以自行修改为所需时间
- 模式：`c` 或 `e`；`c` 为在当前任务创建子任务（如果当前任务已经是子任务则会提示无法创建）；`e` 为编辑当前任务；默认为 `c`；
- 创建后关闭：`0` 或 `1` ；`0` 为创建子任务后不关闭子任务，`1` 为创建任务后自动关闭任务，即子任务变成已完成状态;如果模式为编辑当前任务，则这个参数是无效的；
- 预估时间：即初始预估和结束预估的值，可以输入数字或者 jira 支持的时间格式，如 `1w 2d 3h 4m`

默认使用当天的日期，创建子任务，不自动关闭；不做修改请直接在最后输入预估时间;

#### examples:

- `@2023-07-13@2023-07-13@c@0@2`: 为当前页面的任务创建一个子任务，起始日期为 `2023-07-13`，结束日期为 `2023-07-13`，初始预估工时和结束预估工时为 `2h`

- `@2023-07-13@2023-07-14@c@1@3d`: 为当前页面的任务创建一个子任务，起始日期为 `2023-07-13`，结束日期为 `2023-07-14`，初始预估工时和结束预估工时为 `3d`

- `@2023-07-13@2023-07-14@e@0@2h`: 编辑当前页面的任务，修改数据为起始日期为 `2023-07-13`，结束日期为 `2023-07-14`，初始预估工时和结束预估工时为 `2h`
