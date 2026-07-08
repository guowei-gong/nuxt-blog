---
title: 三元组单集合的游戏数据存储方案
image: https://img2.tofaka.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20260708/bwlb/844X430/db6058b984a040b7f5cd8ee57d7678d.png/webp
date: 2026-07-07 17:09:00
updated: 2026-07-08 16:22:00
description: 现在的游戏服务器通常使用 NoSQL 作为 DB 以满足 Model 设计上的灵活性，MongoDB 则是 NoSQL 的代表之一。本文看点是 MongoDB 在游戏场景的存储方案、索引设计和代码层落地，每个部分都可以单独食用。
type: story
categories: [技术]
tags: [MongoDB, 游戏]
---

## 存储方案

### 单文档
优点是读取简单，缺点是文档大小会逐渐膨胀，而 MongoDB 限制单文档大小在 16 MB 以内，并且该方案总是全量更新。读多写少，能预估对象大小的场景可以使用。

### 分组保存
将 N 个对象拆分到 M 张表中，常见的是将每个业务模块创建一张表，例如 Players 和 Bags，它们通过 PlayerID 作为外键关联。优点是直观，缺点是集合数量膨胀、索引重复、业务层读写放大。

### 三元组单集合
在我们游戏中选择了这种方案，也是我**推荐**的设计。

**只建立一张表存储玩家数据，并通过三元组寻址。**

所谓三元组，指的是通过文档中的三个字段，定位唯一的文档，可以理解成逻辑主键。每一个文档都会包含这三个固定的基础字段：

- `collection`：文档所属的业务模块。
- `key`：同业务模块下对象的 key。
- `player_id`：玩家唯一标识。

例如，获取玩家拥有的某个角色（玩家有多个角色），三元组可以表示为：
```text
collection = role
key = 角色ID
player_id = 玩家ID
```

获取玩家的背包（玩家只有一个背包）：
```text
collection = bag
key = main
player_id = 玩家ID
```

无论是**一对一**的数据，还是**一对多**的数据，都可以用同一套地址结构表达，在集合中定位到唯一文档。

相比 :badge[单文档]{square} , 三元组设计有文档级拆分能力。例如背包、角色、任务都可以独立读写, 不需要每次都更新整份玩家大文档。

相比 :badge[分组保存]{square} , 统一表后不需要为每个模块重复维护一套索引、初始化逻辑和 CRUD 封装。新增一个业务模块时, 只是新增一个逻辑上的 `collection` 值, 而不是新增一张物理表。

它对索引优化也比较友好。因为所有业务文档都落在同一个表中, 核心访问路径最终都会收敛到 `collection + key + player_id` 或 `player_id` 这类固定模式上。一次索引优化, 不是只服务某一张业务表, 而是可以让所有接入这套存储抽象的业务模块一起受益。

## 索引设计

好的索引准则：
- 遵循 :badge[ESR 原则]{link="https://www.mongodb.com/zh-cn/docs/manual/tutorial/equality-sort-range-guideline/#std-label-esr-indexing-guideline"}；
- 精准匹配业务层的查询模式；
- 索引字段区分度高。比如 Bool 类型，只有两个值，选择性很差；
- 索引能完全放入 WiredTiger 缓存，如果索引超出内存，会频繁触发磁盘 I/O。


三元组单集合方案，需要创建两个索引，均为等值查询：

- 主键索引：collection + key + player_id（完全覆盖查询过滤条件）
- 按玩家查询索引：player_id（避免登录场景，加载玩家完整数据时全表扫描）

> 进入运营阶段，还可以考虑建立 collection + player_id + key

### 索引命中分析

分析索引是否被有效使用，主要依赖 `explain()` 函数的输出，主要关注 totalKeysExamined（MongoDB 扫描的索引项数）、totalDocsExamined（MongoDB 回表读取了多少个文档）和 nReturned（返回文档数量）的值是否接近，甚至相等，相等是最理想的情况。[获取更多](https://www.mongodb.com/zh-cn/docs/manual/tutorial/analyze-query-plan/){icon="devicon:mongodb"} 关于 `explain()` 返回值的解释。

下面是我们游戏测试服的 MongoDB 索引分析报告：

```text
// [!code word:idx_collection_key_playerid_unique:80]
// [!code word:idx_playerid:80]
// [!code word:nReturned:80]
// [!code word:keysExamined:80]
// [!code word:docsExamined:80]
// [!code word:IXSCAN:80]
// [!code word:0ms:80]
── 1. 文档统计 ──

  文档总数: 9702

── 2. 子集合分布 (collection 字段) ──

  集合名称                 文档数
  -------------------- ----------
  Role                 1565
  Album                960
  CompletedTask        960
  NpcStore             960
  Player               960
  World                960
  Bag                  960
  Transform            960
  Timer                959
  Partner              457
  DropPity             1

── 3. 索引大小 ──

  索引总大小: 696.00 KB

  索引名称                                          大小
  --------------------------------------------- ------------
  _id_                                          152.00 KB
  idx_collection_key_playerid_unique            420.00 KB
  idx_playerid                                  124.00 KB

── 4. 索引使用统计 ($indexStats) ──

  索引名称                                          使用次数         统计起始时间
  --------------------------------------------- ------------ -------------------------
  _id_                                          1            2026-07-06 08:45:20
  idx_playerid                                  155          2026-07-06 08:45:20
  idx_collection_key_playerid_unique            1487         2026-07-06 08:45:20

── 5. 关键查询执行计划 (explain) ──

  使用样本: collection="Album", player_id="2051981144961855488"

  [查询 1] 单文档精确查询: {collection, key, player_id}
  filter: {"collection":"Album","key":"main","player_id":"2051981144961855488"}
  // [!code ++:2]
  结果: nReturned=1, keysExamined=1, docsExamined=1, time=0ms
  判定: 单文档查询命中唯一索引，扫描量与返回量完全一致
    stage: FETCH
      stage: IXSCAN, index: idx_collection_key_playerid_unique, pattern: {collection: 1, key: 1, player_id: 1}, direction: forward

  [查询 2] 全量加载: {player_id}
  filter: {"player_id":"2051981144961855488"}
  // [!code ++:2]
  结果: nReturned=9, keysExamined=9, docsExamined=9, time=0ms
  判定: 登录加载命中 player_id 索引，没有全表扫描
    stage: FETCH
      stage: IXSCAN, index: idx_playerid, pattern: {player_id: 1}, direction: forward

  [查询 3] 列表查询 (无 ownerID): {collection} + sort {key, player_id}
  filter: {"collection":"Album"}
  sort:   {"key":1,"player_id":1}
  // [!code ++:2]
  结果: nReturned=20, keysExamined=20, docsExamined=20, time=0ms
  判定: 复合索引同时服务过滤和排序，分页列表查询稳定
    stage: LIMIT
      stage: FETCH
        stage: IXSCAN, index: idx_collection_key_playerid_unique, pattern: {collection: 1, key: 1, player_id: 1}, direction: forward
```

## 代码层落地

基于 :badge[官方 mongo-go-driver]{link="https://github.com/mongodb/mongo-go-driver"} 进行封装，我们游戏封装了以下语义：

- 初始化 MongoDB 连接；
- 创建主键索引和玩家索引；
- 提供 `Version` 乐观锁能力；
- 初始化 `storage` 通用存储表；
- 提供事务执行入口 `ExecuteInTx`；
- 基于三元组的 `Write/Read/List/Delete/BulkWrite/BulkDelete`。

:blur[我以前一直不明白封装的意义是什么，官方驱动不是已经把 API 封装好了吗？现在才明白，不是二次包装 API（我做过这样的蠢事 😭），而是**封装业务语义**。换句话说, 业务层并不直接面对 MongoDB 的原始 Collection 和查询语法, 而是面对一套“玩家文档存储”的接口。]

### 基于 Version 的乐观锁

在游戏服务器中，很多玩家数据都是“读出一份文档 -> 在内存中修改 -> 再整体写回 MongoDB”。MongoDB 可以保证单次写入是原子的，但如果两个写入方基于同一个旧版本同时修改，后写入的一方仍然可能覆盖前一个写入结果。

例如，两个服务同时读到了同一份角色数据:

```text
A 读取 role 文档, version = v1
B 读取 role 文档, version = v1

A 修改等级, 写入成功, version 变成 v2
B 修改装备, 如果不检查 version, 就可能用旧快照覆盖 A 的等级修改
```

我的做法是把 `Version` 一起放进更新条件里，只有数据库中当前文档的 `Version` 和调用方读到的版本一致，这次写入才会成功。写入成功后，会更新 `Version` ，这里有个小巧思，我是根据新文档的 `value` 计算 SHA-256 得到，而不是使用额外的计数器。

当然，不是所有写入都需要乐观锁。在我们项目中，使用 `BulkWrite` 时, 这条路径不检查 `Version`。原因是玩家数据的主要写入权由游戏节点和玩家 :tip[Actor]{tip="后续写文章总结一下 Actor (｡･ω･｡) 喵~"} 生命周期约束，正常情况下不存在多个写入方同时改同一份文档的问题。

而 `Version` 乐观锁则保留给存在并发竞争的写入场景，例如 GM 工具、跨服务修复、后台任务或者任何需要**基于旧值修改后再写回**的流程。

## 结语

存储对象的完整表示（数据库中的一条文档）如下：

```go
type Object struct {
	// 集合名称, 用于逻辑分组
	Collection string `bson:"collection" json:"collection"`
	// 对象在集合内的唯一键
	Key string `bson:"key" json:"key"`
	// 对象玩家 ID
	PlayerID string `bson:"player_id" json:"player_id"`
	// 对象的值, 存储为 BSON 原始数据
	Value bson.Raw `bson:"value" json:"value"`
	// 值的 SHA-256 哈希, 用于乐观锁并发控制
	Version string `bson:"version" json:"version"`
	// 创建时间
	CreateTime time.Time `bson:"create_time" json:"create_time"`
	// 最后更新时间
	UpdateTime time.Time `bson:"update_time" json:"update_time"`
}
```

![意义不明的舞蹈 gif](https://img2.tofaka.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20260708/siXm/250X250/%E8%B7%B3%E8%88%9E.gif/webp)

回望这套存储设计, 它并不复杂，对我来说，最大的价值是让后面的业务少做选择题。它不是万能的，例如排行榜这类数据，访问模式就不是按玩家去定位一份文档了，需要单独建表建模。