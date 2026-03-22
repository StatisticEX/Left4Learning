---
title: "《Effective C++》第三版-0 导读（Introduction）"
subtitle: ""
date: 2026-03-11
lastmod: 2026-03-11
draft: false
authors: [Yansong Chen]
description: ""
slug: "effective-cpp-3rd-edition-ch0-2026-03-11"

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

# 术语（Terminology）

**声明式（declaration）**：告诉编译器某个东西的名称和类型（type），但略去细节

```cpp
extern int x;  //对象（object）声明式
std::size_t numDigits(int number);  //函数（function）声明式
class Widget;  //类（class）声明式
template<typename T>;  //模板（template），“typename”的使用见条款42
class GraphNode;  
```

<!--more-->

**签名式（signature）**：每个函数的声明式揭示其签名式，即其参数和返回类型

```cpp
//函数numDigits的签名是std:size_t (int)，即获得一个int并返回一个std:size_t
std:size_t numDigits(int number); 
```

**定义式（definition）**：提供变编译器一些声明式所遗漏的细节

```cpp
int x;  //对象的定义式
std::size_t numDigits(int number)  //函数的定义式
{
	std::size_t digitsSoFar = 1;
	while ((number /= 10) != 0) ++digitsSoFar;
	return digitsSoFar;  //此函数返回其参数的数字个数
}

class Widget {  //class的定义式
public:
	Widget();
	~Widget();
	...
};

template<typename T>  //template的定义式
class GraphNode {
public:
	GraphNode();
	~GraphNode();
	...
};
```

**初始化（Initialization）**：赋予对象初值的过程

default构造函数是一个可被调用而不带实参的函数，其要不没有参数，要不每个参数都有缺省值

```cpp
class A {
public:
	A();  //default构造函数
};

class B {
public:
 explicit B(int x = 0, bool b = true);  //default构造函数
};

class C {
public:
	explicit C(int x);  //不是default构造函数，因其参数没有缺省值
};

//explicit构造函数可阻止它们被用来执行隐式类型转换（implicit type conversions）
//但它们仍可被用来执行显示类型转换（explicit type conversions）
void doSomething(B bObject);  //函数，接受一个类型为B的对象

B bObj1;  //一个类型为B的对象
doSomething(bObj1);  //正确，传递一个B给doSomething函数
B bObj2(28);  //正确，根据int 28建立B
doSomething(28);  //错误！int不能被隐式转换为B
doSomethin(B(28));  //正确，使用B构造函数将int显示转换
```

- copy构造函数用来以同型对象初始化自我对象
- copy assignment操作符用来从另一个同型对象中拷贝其值到自我对象

```cpp
class Widget {
public:
 Widget();  //default构造函数
 WIfget(const WIdget& rhs);  //copy构造函数
 Widget& operator=(const Widget& rhs);  //copy assignment操作符
 ...
};
Widget w1;  //调用default构造函数
Widget w2(w1);  //调用copy构造函数
w1 = w2;  //调用copy assignment操作符，赋值而非非初始化
//"="语法也可用来调用copy构造函数
Widget w3 = w2;  //调用copy构造函数，初始化而非赋值
```

copy构造函数定义一个对象如何passed by value

```cpp
bool hasAcceptableQuality(WIdget w);
...
Widget aWidget;
if (hasAcceptableQuality(aWidget)) ...
//参数w以by value的方式传递给hasAcceptableQuality
//在上述调用中aWidget被复制到w体内，该动作由copy构造函数完成
```

# 命名习惯（Naming Conventions）

| 名称 | 含义 |
| --- | --- |
| lhs | left-hand side（左手端） |
| rhs | right-hand side（右手端） |
| pt | pointer to T（指向一个T型对象的指针） |
| rt | reference to T |
| mf | 成员函数 |

# 关于线程（Threading Consideration）

会在C++构件在多线程环境中有可能引发问题时指出，对多线程不熟悉或没需求可忽略相关讨论

# TR1和Boost

- TR1（Technical Report 1）是一份规范，描述加入C++标准程序库的新机能
- Boot是个组织，也是个网站（[https://www.boost.org/](https://www.boost.org/)），提供可移植、同僚复审、源码开放的C++程序库