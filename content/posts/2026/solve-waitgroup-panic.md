---
title: 修复 WaitGroup 送出的 Panic 大礼包
description: 跨进程的 sync.WaitGroup 计数污染。
date: 2026-03-30 15:59:07
updated:
type: story
categories: [技术]
tags: [游戏]
---

## 背景

分布式游戏服务器，架构上分为 Gate 网关、Node 游戏节点，Consul 服务发现，Redis 玩家定位器。 在一次 Game Node 重启后，新启动的节点进程，触发了 `panic: sync: negative WaitGroup counter` 导致节点崩溃。

## 为什么使用 WaitGroup

我在框架层面定义了四个 State 状态常量：

* **Shut 关闭**：进程未启动或已销毁，不接受任何请求
    
* **Work 工作**：正常运行，正常分配新玩家
    
* **Busy 繁忙**：不要分配新玩家
    
* **Hang 挂起**：正在优雅关闭，等待任务完成后销毁
    

State 的目的是“能不能接活”，并不知道“有多少活没干完”。当状态变为 Hang，怎么知道已接收的请求都响应了？因此引入 WaitGroup 。以玩家`进入游戏 → 领取任务 →下线`为例，梳理目前 WaitGroup 的完整链路，是定位 Panic 的关键。

### 玩家上线

```
客户端连接 Gate → Gate 转发登录请求到 Node → Node 处理登录
    │
    └── ctx.BindNode() → 🟢 AddWait (+1) 写入 Redis 绑定关系
```

### 玩家领取任务

```
客户端发包 → Gate 查 Redis 定位 Node 并通知 Node → Node 串行处理

全程没有 AddWait/DoneWait。
```

### 玩家下线

```
Gate 检测到断线 → 通知 Node → Node 执行断线处理
    │
    └── proxy.UnbindNode() → 🔴 DoneWait (-1) 对应 BindNode 的 Add
```

正常流程下，上线 +1，下线 -1，WaitGroup 归零， `[wg.Wait()](http://wg.Wait%28%29)`  返回。

但 Game Node 重启，打破了节点的配对规则！场景如下：

```
时间线      Gate                    Node A (旧)              Node B (新)
────────────────────────────────────────────────────────────────────────
T1        玩家连接中               BindNode: wg.Add(1)
          
                                                            Redis: 玩家 → "game" 节点

T2        ---                     进程退出                   ---

T3        ---                     ---                       启动，wg = 0

T4        检测到玩家断线
          查 Redis: 玩家 → "game"
          查 Consul: "game" → B
          → 发给了 B!

T5        ---                     ---                      收到断线事件
                                                           → UnbindNode()
                                                           → doneWait()
                                                           → wg.Done()
          
                                                           → 0 → -1
                                                           → 💥 PANIC
```

我对 Add/Done 配对隐含了“同一进程”的假设。Node A 做的 Add +1 是在 A 进程里，但 Done -1 却是在 B 进程里。B 进程从未 Add，直接 Done，WaitGroup 自然变为负数了。

至此，问题一目了然了，Node A 异常退出后，Redis 玩家定位器中仍残留玩家与 Node A 的绑定，当 Node B 以相同名称注册到 Consul 后，Gate 就会把本应发给 A 的事件，错误的发给 B。

## 解决方案

重启 Game Node 节点时，使用不同的实例 ID。

## 总结

分布式系统中进程重启，可能会打破 WaitGroup 同一生命周期内配对。