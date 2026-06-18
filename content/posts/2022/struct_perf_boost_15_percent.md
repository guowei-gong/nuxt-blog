---
title: 0 秒改 struct 性能直接提升 15%，产品姐姐都夸我好棒
description: 简单地重新排序结构体中的字段，提高了 Go 程序的速度和内存使用率。
date: 2022-08-18 19:53:37
updated:
type: story
categories: [技术]
tags: [内存对齐]
---

让我们先来看一个例子。如下。

```go
type BadStruct struct {
    age          uint8
    IdCardNumber uint64
    DateOfBirth  uint16
}

type GoodStruct struct {
    age          uint8
    DateOfBirth  uint16
    IdCardNumber uint64
}
```

在上面的例子中，我们定义了两个具有相同字段的结构体。接下来让我们编写一个简单的程序来输出他们的内存使用情况。点击[此处](https://go.dev/play/p/DekLCtTGo6v)您可以获取测试代码。

```
Bad struct is 24 bytes long
Good struct is 16 bytes long
```

如您所见，它们占用的内存不同。

到底发生了什么，导致两个字段相同的结构体消耗不同的字节？

<!-- more -->

答案是数据在操作系统中的内存排列方式。换句话说，数据结构对齐。

`CPU` 以字长的方式读取数据，而不是通过字节大小。64 位操作系统中一个字长为 8 个字节，而 32 位操作系统中一个字长为 4 个字节。换句话说，`CPU` 以字长的倍数读取地址。

![糟糕的结构体-01](https://pic2.fukit.cn/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20260123/XAeT/1974X437/BadStruct-01.png/webp)

在 64 位操作系统中，为了获取变量 `IdCardNumber`，我们的 `CPU` 需要两个周期来访问数据，而不是一个周期。

第一个周期将获取到 0 到 7 的内存，其余周期获取其余部分。

把它想象成一个笔记本，每页只能存储一个字大小的数据，此时是 8 个字节。如果 `IdCardNumber` 分散在两个页面上，则需要翻页两次才能检索完整的数据。

**这是低效的。**

因此我们需要对齐数据结构，即将数据存储在一个地址等于数据大小的倍数的位置。

例如，一个 2 字节的数据可以存储在内存 0、2 或 4 中，而一个 4 字节的数据可以存储在内存 0、4 或 8 中。

![糟糕的结构体-02](https://pic2.fukit.cn/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20260123/C5Ll/1968X597/BadStruct-02.png/webp)

通过简单的对齐数据，确保 `IdCardNumber` 可以在同一个 `CPU` 周期内检索到变量。

填充是实现数据对齐的关键。操作系统在数据结构之间用额外的字节填充数据以对齐它们。这就是额外内存的来源！

让我们再来看一看 `BadStruct` 和 `GoodStruct`。

![修改结构体后的对比](https://pic2.fukit.cn/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20260123/pcnx/1808X1024/GoodStruct-01.png/webp)

`GoodStruct` 消耗更少的内存，仅仅是因为它比 `BadStruct` 有更好的结构体字段顺序。

由于填充，两个数据结构分别变成了 16 字节和 24 字节。

所以，您只需重新排序结构体中的字段，就可以节省额外的内存！

最后，让我们来做一个简单你的基准测试来证明它在速度和内存的区别，结果如下。点击[此处](https://go.dev/play/p/i6F3VRFY61n)您可以获取可运行的代码。

![基准测试结果](https://xland.eu.org/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20251110/w6n2/1065X390/Result.png)

从结果您可以看出，遍历 `GoodStruct` 花费的时间确实更少。重新排序结构体字段可以提高程序的内存使用率和速度。
