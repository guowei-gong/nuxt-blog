---
title: 移除跑马灯广告
description: 通过 FFmpeg 批量修剪多个视频的指定位置。
date: 2021-02-23 19:53:37
updated:
type: story
categories: [技术]
tags: [FFmpeg]
---

## 背景 🎨

通过爬虫获取到的电视剧，在顶部往往存在跑马灯广告。相同播放域名存在一定的规律，可以对特定时间进行水印覆盖，但是通过人工去寻找这个规律，仅只能抽样，存在极大的不确定性。并且水印覆盖存在对视频编码与解码的行为，时间与空间复杂度都是较高的。

## 预期 🔭

### 处理速度

1 个小时的视频，处理时间为 **10 ~ 15** 分钟

视频裁剪前：
![1109X574/CutVideo-01.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/rJlP/1109X574/CutVideo-01.png)

视频裁剪后：
![1109X560/CutVideo-02.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/1B89/1109X560/CutVideo-02.png)

补充说明

预估时间为 10~15 分钟，不是很准确的原因是目前服务器负责了其他任务，占用的内存较大
解析过程速度截图如下：
![929X152/CutDetail-01.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/2lOO/929X152/CutDetail-01.png)

## 特征 🍽️

- 缺点
  - 不执行就地编辑；
  - 水印覆盖存在解码与编码过程，非常慢。

- 优势
  - 转换视频格式；
  - 支持主流视频格式，例如 ts、mp4、avi、m3u8；
  - 跨平台使用，支持 masOS、linux、ubuntu、windows；
  - 视频处理之前，就能通过内置命令查看处理后的结果，提供了预览功能。

## 正文 💻

### 安装

masOS：

```shell
brew install ffmpeg
```

### 裁剪

让我们从基础开始。要使用FFmpeg修剪视频的一部分，命令为：

`ffmpeg -i input.mp4 -filter:v "crop=w:h:x:y" output.mp4`

- w 输出视频宽度（修剪区域的宽度）。默认值为输入视频宽度（输入视频宽度= iw）
- h 输出视频高度（裁剪区域的高度）。默认值为输入视频高度（输入视频高度= ih）
- x 从修剪开始的水平位置。从左边开始（绝对左边距为 0）
- y 从视频顶部开始，从此处开始修剪的垂直位置（绝对顶部为 0）

### 入门

让我们看一个基本的 FFmpeg 修剪的例子。

从中心开始裁剪一个 100 像素的正方形 (默认情况下 FFmpeg 设置为居中，因此 x 和 y 未指定任何值)。

`ffmpeg -i input.mp4 -filter:v "crop=100:100" output.mp4`

![500X470/Demo-01.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/Dl0N/500X470/Demo-01.png)

从左上方开始裁剪一个 100 像素的正方形。

`ffmpeg -i input.mp4 -filter:v "crop=100:100:0:0" output.mp4`

![500X470/Demo-02.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/9zPD/500X470/Demo-02.png)

从右上方开始裁剪一个 100 像素的正方形。

`ffmpeg -i input.mp4 -filter:v "crop=100:100:iw-100:0" output.mp4`

![500X469/Demo-03.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/aLEm/500X469/Demo-03.png)

### 裁剪视频边界

要使用 FFmpeg 修剪视频边界（顶部，底部，左侧，右侧边界），请使用：

`ffmpeg -i input.mp4 filter:v "crop=iw-n:ih-n" output.mp4`

iw：输入视频的宽度
ih：输入视频的高度
n：裁剪像素数（输入预期视频宽度）
m：裁剪像素数（输入预期视频高度）

强烈建议使用以下命令，预览（播放）裁剪后的视频，有益于快速检查裁剪区域是否正确。

`ffplay -filter:v "crop=w:h:x:y" input.mp4`

### 裁剪视频顶部、底部、左右边框

`ffmpeg -i input.mp4 filter:v "crop=iw-100:ih-200" output.mp4`

假设您知道输入视频的高度和宽度(500 x 300 在此示例中)，以上命令也可以编写为：

`ffmpeg -i input.mp4 filter:v "crop=500-100:300-200" output.mp4`

![500X472/Demo-04.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/v9ua/500X472/Demo-04.png)

### 仅裁剪左右边框

`ffmpeg -i input.mp4 filter:v "crop=iw-200" output.mp4`

![500X663/Demo-05.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/DVjq/500X663/Demo-05.png)

### 仅裁剪顶部和底部边框

`ffmpeg -i input.mp4 filter:v "crop=iw:ih-200" output.mp4`

![500X470/Demo-06.png](https://img.51shazhu.com/autoupload/Z3wg1auvHGH_fxQcOFgj2SfNcKcqEnRmcljopnyJoMs/20250731/rz8s/500X470/Demo-06.png)

## 参考文献 🎒

- [FFMpeg-crop 官方文档](https://ffmpeg.org/ffmpeg-all.html#crop)

## 结语 🎉

FFmpeg 裁剪后的视频是对视频原尺寸有影响的，分辨率没有影响。对于视频跑马灯广告的处理方式，还有前端对播放器进行遮挡等方法，不过使用该方法从片源的角度解决了问题，同时巧妙的避开了大量的解码与转码的过程，虽然观影体验降低，但是不能有敏感的广告才是优先级最高的。
