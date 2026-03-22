---
title: "常用的Linux命令介绍：13个基本命令和Shell脚本编程"
subtitle: ""
date: 2026-03-11
lastmod: 2026-03-11
draft: false
authors: [Yansong Chen]
description: ""
slug: "linux-commands-2026-03-11"

tags: ["编程"]
categories: []
series: []

hiddenFromHomePage: false
hiddenFromSearch: false

featuredImage: ""
featuredImagePreview: ""

toc:
  enable: true
  auto: true
math:
  enable: true
lightgallery: true
---

*本文档作为笔记整理的初次尝试*

[常用的Linux命令介绍：13个基本命令和Shell脚本编程_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Uv4y127tU/?spm_id_from=333.337.search-card.all.click&vd_source=b5572925fdc8d70ef1e8d435658f8063)

<img src="https://s2.loli.net/2024/01/15/dAGUlxNRDM1KtWP.png" alt="Untitled" style="zoom:67%;" />

```
# 文件和目录操作
ls
cd
pwd
# 文本文件的阅读和编辑
cat/tail/head
less/more
nano/vim
# 文件属性
file
where
# 打印
echo
# 例子
Shell programming: variables
Shell programming: for loop
```

<!--more-->

# ls

```bash
# ls: list
ls # 列出当前目录下所有的文件
ls -l # 列出当前目录下所有的文件和属性
ls -a # 列出当前目录下所有的文件，且包含隐藏文件
ls -la # 同时也列出隐藏文件的属性
ll # ls -l的缩写
```

![Untitled](https://s2.loli.net/2024/01/15/85kLJ32sHSMEt41.png)

举例说明

```bash
drwxrwxr-x 29 cys cys     4096 4月  19  2023  anaconda3
```

- drwxrwxr-x：表示权限
    - 第一个字母：例子中d表示该文件是目录
        - d：directory，目录
        - -： 普通文件
    - 第一个rwx：该文件所有者的权限，例子中rwx表示该文件所有者（对应第一个cys）具有读写和执行的权限
        - r：read，读
        - w：wirte，写
        - x：execute，执行
    - 第二个rwx：该文件所有者同组（group）的人的权限，例子中rwx表示该文件所有者同组（对应第二个cys，此处恰好也叫cys）的人具有读写和执行的权限
    - 第三个rwx：其他人的权限，例子中r-x表示其他人有读和执行的权限，没有写的权限
- 4069：文件大小
- 4月  19  2023：修改时间

![Untitled](https://s2.loli.net/2024/01/15/mIMiDlTJ3aLK2dt.png)

# cd

```bash
# cd: change directory
cd omg-tools # 进入当前目录下的omg-tools目录
cd .. # 返回上级目录
cd . # 进入当前目录，相当于没变
cd ../.. # 返回上级目录的上级目录
cd - # 返回刚才所在的目录
```

![Untitled](https://s2.loli.net/2024/01/15/zvxdu4Cgp3XlMU6.png)

**Linux中目录使用斜杠‘/’而不是反斜杠‘\’**

# pwd

```bash
# pwd: print working dirtectory
pwd # 打印当前路径
```

![Untitled](https://s2.loli.net/2024/01/15/N6IKbUtrfhQOkZF.png)

# cat/tail/head

```bash
cat setup.py # 查看当前目录下setup.py内容，可使用tab键自动补全文件名 
head setup.py # 查看当前目录下setup.py开头的内容
head --lines=3 setup.py  # 看开头3行
tail --lines=3 setup.py  # 看结尾3行
```

![Untitled](https://s2.loli.net/2024/01/15/w2S1F8HKxicg7Al.png)

![Untitled](https://s2.loli.net/2024/01/15/qrUGcMt3Jeap1L7.png)

# less/more

```bash
less setup.py  # 查看setup.py，只显示一部分，↑↓键上下移动，q键退出
more setup.py  # 查看setup.py，只显示一部分，只能向下（我这里是d键）移动（有的可以上下移动），q键退出
```

# nano/vim

```bash
# 文本编辑器
nano readme.md # 编辑setup.py，下方有菜单
vim readme.md # 编辑setup.py，具体可以查手册
```

nano

![Untitled](https://s2.loli.net/2024/01/15/SqY6AejRV8umhQx.png)

vim

![Untitled](https://s2.loli.net/2024/01/15/jXlFNk9wLaAHTPt.png)

# file/where

```bash
file readme.md # 查看文件属性
where gcc # 查询路径，where命令可能没有，因为where命令是zsh的内建命令，而不是bash的
which gcc  # 查询路径
```

![Untitled](https://s2.loli.net/2024/01/15/MSIF6bH3wZQGv5J.png)

# echo

```bash
echo abd # 打印abd
echo "abc hello" # 打印字符串abc hello"
```

![Untitled](https://s2.loli.net/2024/01/15/b5g2LBHVpPeRqlj.png)

# Shell programming: variables

```bash
# 使用变量
h="hello" # 定义变量h
echo h # 打印变量h
h="hellox" # 重新定义变量h
echo h # 打印变量h
echo "abc-$h-efg" # $表示使用变量h
echo "abc-${h}efg" #  {}可以避免歧义，echo "abc-$hefg"会认为使用变量hefg
```

![Untitled](https://s2.loli.net/2024/01/15/4iSphxt1eMocOsP.png)

# Shell programming: for loop

```bash
# 编写循环命令程序
for ff in LMPC.???  # 对于当前目录下所有LMPC.后面跟3个字符的文件（？表示单个字符）
> do echo $ff  # 打印变量ff
> done  # 结束

for ff in LMPC.???  # 对于当前目录下所有LMPC.后面跟3个字符的文件
> do echo $ff new_$ff  # 打印变量，以防下一步重命名出错
> done  # 结束

for ff in LMPC.???  # 对于当前目录下所有LMPC.后面跟3个字符的文件
> do mv $ff new_$ff  # mv表示重命名，原文件名$ff，新文件名new_$ff
> done  # 结束

# *LMPC.???表示LMPC.???之前有任意长度字符（*表示任意长度字符）
# #new_表示截取变量ff中new_之后的部分（掐头）
# 若为%new_则是截取变量ff中new_之前的部分（去尾），键盘上#和%正好在$左右两边
for ff in *LMPC.???; do echo $ff ${ff#new_}; done

# 重命名，把名字改回来
for ff in *LMPC.???; do mv $ff ${ff#new_}; done
```

![Untitled](https://s2.loli.net/2024/01/15/8pHAUVx43MFZbKf.png)

![Untitled](https://s2.loli.net/2024/01/15/vpt5cDxLXUnV1SF.png)