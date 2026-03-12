---
title: "《Effective C++》第三版-3. 资源管理（Resource Management）"
subtitle: ""
date: 2026-03-11
lastmod: 2026-03-11
draft: false
authors: [Yansong Chen]
description: ""

tags: ["C++"]
categories: ["编程语言"]
series: ["《Effective C++》第三版"]

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

[TOC]

*前几章的笔记多有不足，这一章会持续改进*

# 条款13：以对象管理资源（Use objects to manage resources）

## 关键想法

考虑以下易出错的例子：

```cpp
class Investment { ... };  //投资类型继承体系中的root类
//工厂函数，指向Investment继承体系内的动态分配对象，参数省略
Investment* createInvestment {}; 
void f()
{
	Investment* pInv = createInvestment();  //调用工厂函数
	...  //若这里return则无法执行delete
	delete pInv;  //释放pInv所指对象
}
```
<!--more-->

解决方案：**把资源放进对象，可利用析构函数自动调用机制确保资源释放**

以对象管理资源的两个关键想法：

- 获得资源后立刻放进管理对象（managing object）内
    - 资源取得时机便是初始化时机（Resource Acquisition Is Initialization，RAII）
    - 有时获得的资源会拿来赋值而非初始化
- 管理对象运用析构函数确保资源释放
    - 不论控制流如何离开区块，一旦对象被销毁（如离开对象作用域）其析构函数会自动调用

## 智能指针

**auto_ptr**：

- 通过copy构造函数或copy assignment操作符复制它们，它们会变成null，复制所得的指针将取得资源的唯一所有权
- 故需要元素能够复制地STL容器不兼容auto_ptr

> *[auto_ptr在C++11中已被弃用](https://zhuanlan.zhihu.com/p/356627164)，以下简要介绍*
> 

```cpp
void f()
{
	std::auto_ptr<Investment> pInv(createInvestment());
	...
}  //auto_ptr的析构函数自动删除pInv

std::auto_ptr<Investment< pInv1(createInvestment());
std::auto_ptr<Investment< pInv2(pInv1);  //现在pInv2指向对象，pInv1为null
pInv1 = pInv2;  //现在pInv1指向对象，pInv2为null
```

**shared_ptr**：属于引用计数型智慧指针（reference-counting smart pointer，RCSP）

- 会持续追踪有多少对象指向某笔资源，并在无人指向它时自动删除该资源
- 其行为类似垃圾回收（garbage collection），但RCSP无法打破环状引用（cycles of references，如两个未被使用的对象彼此互指）
- 适用于STL容器

```cpp
void f()
{
	std::tr1::shared_ptr<Investment> pInv(createInvestment());
	...
}  //shared_ptr的析构函数自动删除pInv

void f()
{
	...
	std::tr1::shared_ptr<Investment> pInv1(createInvestment());
	std::tr1::shared_ptr<Investment> pInv2(pInv1);  //指向同一个对象
	pInv1 = pInv2;  //同上
	...
}  //pInv1和pInv2被销毁，他们所指的对象也被销毁
```

auto_ptr和shared_ptr的析构函数做delete而非delete[]，故不适合在动态分配而得的array身上使用，即使能通过编译

> Boost中boost::scoped_array和boost::shared_array则可用于数组且类似auto_ptr和shared_ptr
> 

```cpp
std::auto_ptr<std::string> aps(new std::string[10]);  //会调用错误形式的delete
std::tr1::shared_ptr<int> spi(new int[1024]);  //同上
```

**Tips：**

- 为防止资源泄漏，请使用RAII对象，其在构造函数中获得资源并在析构函数中释放资源
- RAII中常用shared_ptr，其copy行为比较直观（auto_ptr已被弃用）

# 条款14：在资源管理类中小心copying行为（Think carefully about copying behavior in resource-managing classes）

*对mutex一点不了解emmm，硬着头皮总结下*

非heap-based的资源不适合使用智能指针作为资源掌管者（resource handlers）

考虑使用C API函数处理类型为Mutex的互斥器对象（mutex objects），共有lock和unlock两函数可用。为确保不会忘记把被锁的Mutex解锁，可建立类以管理机锁，该类的结构符合RAII守则

```cpp
void lock(Mutex* pm);  //锁定pm所指的互斥器
void unlock(Mutex* pm);  //解除互斥器的锁定

//管理机锁的类，符合RAII守则
class Lock {
public:
	explicit Lock(Mutex* pm)
		: mutexPrt(pm)
	{ lock(mutexPtr); }
	~Lock() { unlock(mutexPtr); }
private:
	Mutex *mutexPtr;
};

//客户对Lock的用法符合RAII方式
Mutex m;
...
{
	Lock ml(&m);
	...
}

```

如果要复制Lock对象，则可能：

```cpp
Lock m11(&m);  //锁定m
Lock m12(m11);  //将m11复制到m12上
```

- 禁止复制
    - 很多时候允许RAII对象复制不合理（则应将copying操作声明为private）、
    - 但Lock类是少有的能合理拥有同步化基础器物（synchronization primitives）的副本，其可能可以被复制
- 对底层资源使用引用计数法
    - 和RAII规则类似，但是当使用上一个Mutex时需要解除锁定而非删除
    - tr1::shared_ptr允许指定删除器（deleter），其为函数或函数对象，当引用次数为0时调用

```cpp
class Lock {
public:
	explicit Lock(Mutex* pm)  //以Mutex初始化shared_ptr
		: mutexPtr(pm, unlock)  //以unlock函数作为删除器
	{
		lock(mutexPtr.get());
	}
private:
	std::tr1::shared_ptr<Mutex> mutexPtr;  //使用shared_ptr替换raw pointer
};
```

- 复制底部资源，即进行深拷贝（deep copying），如将指针及其所指对象都复制
- 转移底部资源的拥有权
    - 少数情况需要确保只有一个RAII指向一个未加工资源（raw resource），即使RAII对象被复制
    - 此时资源的所有权会从被复制物转移到目标物

**Tips：**

- 复制RAII对象必须一并复制它所管理的资源，故资源的copying行为决定RAII对象的copying行为
- 通常的RAII类的copying行为是：抑制copying、使用引用计数法。但其他行为也可能实现

# 条款15：在资源管理类中替工对原始资源的访问（Provide access to raw resources in resource-managing classes）

*由于auto_ptr已弃用，本条款不整理和其相关的内容*

## 显示转换或隐式转换

有时智能指针不能直接使用（如下例子），需要**显示转换**或**隐式转换**：

```cpp
class Investment {
public:
	bool isTaxFree() const;
	...
}
Investment* createInvestment();  //工厂函数
std::tr1::shared_ptr<Investment> pInv(createInvestment());
int daysHeld(const Investment* pi);  //返回投资天数

int days = daysHeld(pInv);  //错误！daysHeld需要Investment*而非tr1::shared_ptr
//显示转换
int days = daysHeld(pInv.get());
//隐式转换，tr1::share_ptr重载了指针取值（pointer dereferencing）操作符（->和*）
bool taxable1 = !(pInv->isTaxFree());
bool taxable2 = !((*pInv).isTaxFree());
```

## 优缺点

有时必须取得RAII对象内的原始资源，考虑用于字体的RAII类：

```cpp
FontHandle getFont();  //这是C API，省略参数
void releaseFont(FontHandle fh);  //来自同一组
class Font {  //RAII类
public:
	explicit Font(FontHandle fh)  //获得资源
		: f(fh)  //使用pass-by-value，因为C API这样做
	{ }
	~Font() { releaseFont(f); }  //释放资源
private:
	FontHandle f;  //原始字体资源
};
```

- 显示转换：可读性强，但是需要API时必须调用get

```cpp
class Font { 
public:
	...
	FontHandle get() const { return f; }  //显式转换函数
	...
};

void changeFontSIze(FontHandle f, int newSize);
Font f(getFont());
int newFontSize;
...
changeFontSize(f.get(), newFontSize);
```

- 隐式转换：调用C API更自然，但是易出错
    - 可能在需要Font时意外创建FontHandle，且f被销毁则f0成为悬空的（dangle）

```cpp
class Font {  //RAII类
public:
	...
	operator FontHandle() const { return f; }  //隐式转换函数
	...
};
changeFontSize(f, newFontSize)
FontHanle f0 = f;  //想要拷贝，但是将f1隐式转换为其底部的FontHandle才复制
```

**Tips：**

- API往往要求访问原始资源，故RAII类应提供取得其管理的资源的方法
- 对原始资源的访问包含显示转换和隐式转换，一般显示转换安全而隐式转换方便

# 条款16：成对使用new和delete时要采取相同形式（Use the same form in corresponding uses of new and delete）

```cpp
std::string* stringArray = new std::string[100];
...
delete stringArray
```

以上程序的行为不明确：

- 使用new时会发生两件事：
    - 内存分配
    - 调用针对此内存的构造函数
- delete需要知道被删除的内存内有多少对象，其决定了要调用多少析构函数
    - 若指针指向数组对象，则数组所用的内存包含数组大小信息
    - 若指针指向单一对象，则无上述信息
    - 需要人为告诉delete所删除的对象类型

```cpp
std::string* stringPtr1 = new std::string;
std::string* stringPtr2 = new std::string[100];
...
delete stringPtr1;  //删除对象
delete [ ] stringPtr2;  //删除对象组成的数组
```

使用typedef需要考虑相同的问题（下例中数组使用typedef并不合适，容易产生错误，仅做说明）：

```cpp
typedef std::string AddressLines[4];  //地址有4行，每行一个string
std::string* pal = new AddressLines;  //本质上同new string[4]
delete pal;  //错误！行为未有定义
delete [ ] pal;  //正确
```

**Tips：**

- 如果new加上[]，则delete必须加上[]；如果new没加[]，则delete不能加[]

# 条款17：以独立语句奖newed对象置入智能指针（Store newed objects in smart pointers in standalone statements）

考虑涉及优先权的例子：

```cpp
int priority();
void processWidget(std::tr1::shared_ptr<Widget> pw, int priority);

//错误！new Widget无法隐式转换为shared_ptr，因为shared_ptr的构造函数为explicit
processWidget(new Widget, priority());
 
//可以通过编译，但可能泄漏资源
processWidget(std::tr1::shared_ptr<Widget>(new Widget), priority());
```

编译器产出processWidget调用码之前，必须首先核酸即将被传递的各个实参，其要做事情有三件：

- 第一实参
    - 执行new Widget
    - 调用tr1::shared_ptr构造函数
- 第二实参
    - 调用priority

实际执行的次序弹性很大，只能确定执行new Widget一定先于调用tr1::shared_ptr构造函数，但调用priority的次序不一定。若编译器选择以下次序：

1. 执行new Widget
2. 调用priority
3. 调用tr1::shared_ptr构造函数

则如果调用priority出现异常，那new Widget返回的指针将遗失，其未来得及放入tr1::shared_ptr内，进而导致资源泄漏。即**创建资源和资源转换为资源管理对象直接有可能发生异常干扰**

解决方法：使用分离语句，因为编译器对于跨越语句的各项操作没有重新排列的自由

```cpp
std::tr1::shared_ptr<Widget> pw(new Widget);
processWidget(pw, priority());  //这样调用不会泄漏
```

**Tips：**

- 以独立语句将newed对象存储于智能指针内，否则一旦有异常则可能发生隐秘的资源泄漏