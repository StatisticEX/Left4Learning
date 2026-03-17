---
title: "《Effective C++》第三版-5. 实现（Implementations）"
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

# 条款26：尽可能延后变量定义式的出现时间（Postpone variable definitions as long as possible）

**应延后变量的定义，知道不得不使用该变量的前一刻为止，甚至直到能够给他初值实参为止**

> 当程序的控制流达到变量的定义式时，会有构造成本；当离开变量的作用域时，会有析构成本

```cpp
std::string encryptPassword(const std::string& password)
{
	...
	std::string encrypted(password);  //通过copy构造函数定义并初始化
	encrypt(encrypted);
	return encrypted;
}
```
<!--more-->

考虑在循环中使用的变量：

- 定义于循环外：
    - 复制成本低于构造+析构成本时一般更高效，此时适用于效率高度敏感（performance-sensitive）的部分
    - 定义的变量作用域更大，可能降低程序的可读性和易维护性
- 定义于循环内：
    - 其他情况适用

```cpp
//定义于循环外：1个构造函数+1个析构函数+n个赋值操作
Widget w;
for (int i = 0; i < n; ++i) {
	w = 取决于i的某个值;
	...
}
//定义于循环内：n个构造函数+n个析构函数
for (int i = 0; i < n; ++i) {
	Widget w(取决于i的某个值);
	...
}
```

**Tips：**

- 尽可能延后变量定义式的出现，这样可增加程序的清晰度并改善程序效率

# 条款27：尽量少做转型动作（Minimize casting）

C++支持的转型动作通常有三种形式：

- 旧式转型
    - C风格的转型
    - 函数风格的转型
- 新式转型（也称new style或C++-style cast）
    - const_cast：通常将对象的常量性移除（cast away the constness）
        - 是唯一由此能力的C++-style操作符
    - dynamic_cast：主要用来执行安全向下转型（safe downcasting），即决定某个对象是否归属继承体系中的某个类型
        - 是唯一无法用旧式语法执行的动作
        - 也是唯一可能耗费重大运行成本的转型动作
    - reinterpret_cast：执行低级转型，实际动作和结果可能取决于编译器，故不可移植
        - 如把pointer to int转型为int，这类转换在低级代码以外很少见
        - 本书只在针对原始内存（raw memory）写出一个调试用的分配器（debugging allocater）时使用，见条款50
    - static_cast：强迫隐式转换（implicit conversion）
        - 如non-const到const，int到double，以及上述多种转换的反向转换，如void*指针到typed指针，pointer-to-base到pointer-to-derived
        - 无法将const转为non-const

```cpp
//旧式转型
(T)expression;  //C风格的转型
expression(T);  //函数风格的转型
//新式转型
const_cast<T>( expression );
dynamic_cast<T>( expression );
reinterpret_cast<T>( expression );
static_cast<T>( expression );
```

新式转换相对旧式转换有两个优点：

- 易于辨识，从而简化定位错误的过程
- 转型动作的目标约窄化，编译器越可能诊断出错误的地方

使用旧式转型的时机：当要调用explicit构造函数将一个对象传递给一个函数

```cpp
class Widget {
public:
	explicit WIdget(int size);
	...
};
doSomeWork(Wistaticdget(15));  //函数风格转型
doSomeWork(static_cast<Widget>(15));  //C++风格转型
```

任何一类转换往往令编译器编译出运行期间执行的码。

> 下例中pb和&d可能不相同，此时会有偏移量在运行期被施行于Derived*指针上，以取得Base*的指针值。此事在多重继承中几乎一直发生，在单一继承中也可能发生，且偏移量可能编译器的不同而不同，故应避免这种用法
> 

```cpp
class Base { ... };
class Derived: public Base { ... };
Derived d;
Base* pb = & &d;  //把Derived*隐式转换为Base*
```

考虑下例：许多应用框架（application frameworks）都要求派生类内的虚函数代码的第一个动作就先调用基类的对应函数，此处假设SpecialWindow的onResize函数要首先调用Window的onResize函数

```cpp
class Window {
public:
	virtual void onResize() { ... }
	...
};
class SpecialWindow: public WIndow {
public:
	virtual void onResize() {
		static_cast<WIndow>(*this).onResize();  //不可行！将*this
		...  //这里进行SpecialWindow专属行为
	}
	...
};
```

上述代码调用的不是当前对象上的函数，而是转型动作所建立的*this对象的基类成分的副本的onResize。

> 若Window::onResize修改了对象内容，则改动的是副本而非当前对象；若SpecialWIndow::onResize也修改对象内容，则当前对象会被改动
> 

正确的写法如下：

```cpp
class SpecialWindow: public Window {
public:
	virtual void onResize() {
		Window::onResize();  //调用Window::onResize作用于*this
		...
	}
	...
};
```

dynamic_cast的注意事项：

- 许多实现版本执行速度相当慢
- 可在只有指向基类的指针或引用时为派生类对象身上执行其操作函数
- 避免使用dynamic_cast的一般性方法有二（并非放之四海而皆准）
    - 使用容器并在其中存储直接指向派生类对象的指针
        - 无法在同一容器内存储指向不同派生类的指针，需要多个容器处理多种派生类且必须具备类型安全性（type-safe）
    - 通过基类接口处理所有派生类，即在基类内提供虚函数做想对派生类做的事
- 决不能连串（cascading）dynamic_cast

```cpp
//使用容器并在其中存储直接指向派生类对象的指针
class Window { ... };
class SpecialWindow: public Window {
public: 
	void blink();  //闪烁效果
	...
};
//容器内是派生类而非基类，免去在循环中使用dynamic_cast把积累转换为派生类的步骤
typedef std::vector<std::tr1::shared_ptr<SpecialWindow>> VPSW;
VPSW winPtrs;
...
for (VPSW::iterator iter = winPtrs.begin(); iter != winPtrs.end(); ++iter)
	(*iter)->blink();  //这样写比较好，不使用dynamic_cast

//通过基类接口处理所有派生类
class Window {
public:
	virtual void blink() { }
		...
};
class SpecialWindow: public Window {
public: 
	virtual void blink() { ... }
	...
};
typedef std::vector<std::tr1::shared_ptr<Window>> VPW;
VPW winPtrs;
...
for (VPW::iterator iter = winPtrs.begin(); iter != winPtrs.end(); ++iter)
	(*iter)->blink(); 
	
//连串dynamic_cast
for (VPW::iterator iter = winPtrs.begin(); iter != winPtrs.end(); ++iter)
{
	if (SpecialWindow1 * psw1 = dynamic_cast<SpecialWindow1*>(iter->get()) { ... }; 
	else if (SpecialWindow2 * psw2 = dynamic_cast<SpecialWindow2*>(iter->get()) { ... };
	else if (SpecialWindow3 * psw3 = dynamic_cast<SpecialWindow3*>(iter->get()) { ... };
}
```

**Tips：**

- 尽量避免撰写，尤其是在注重效率的代码中避免dynamic_cast
- 若转型有必要，尝试将它隐藏于某个函数背后，客户随后可以调用该函数而非在他们自己的代码内转型
- 宁可使用新式转型也不要使用旧式转型，前者易分辨且分类更细

# 条款28：避免返回handles指向对象内部成分（Avoid returning “handles” to object internals）

考虑涉及矩形的例子：

> 引用、指针、迭代器都是所谓的handles（号码牌，用来取得某个对象）
> 

```cpp
class Point {
public:
	Point(int x, int y);
	...
	void setX(int newVal);
	void setY(int newVal);
	...
};

struct RectData {
	Point ulhc;
	Point lrhc;
};
class Rectangle {
public:
	...
	// 如果没有cosnt Point&，则引用指向的内容可能变化
	// Point& upperLeft() const { return pData->ulhc; }
	// Point& lowerRight() const { return pData->lrhc; }
	// 采取这种方式可保证handle指向的数据不变
	const Point& upperLeft() const { return pData->ulhc; }
	const Point& lowerRight() const { return pData->lrhc; }
	...
private:
	std::tr1::shared_ptr<RectData> pData;
};

class Rectangle {

};
```

即使指向的内容不变，返回handle还是可能导致dangling handle（悬空的号码牌），即所指的东西不复存在：

1. boundingBox返回一个新的、暂时的Rectangle对象（权且称temp）
2. temp.upperLeft()返回指向temp内部的Point的引用
3. 引用赋给pUpperLeft
4. temp会被销毁，则其内部Point析构
5. pUpperLeft悬空！

```cpp
class GUIObject { ... };  //考虑GUI对象的矩形外框
const Rectangle boundingBox(const GUIObject& obj);  //以by value返回矩形
GUIObject* pgo;
...
const Point* pUpperLeft = &(boundingBox(*pgo).upperLeft());  //可能悬空！
```

**Tips：**

- 避免返回handles（包括引用、指针、迭代器）指向对象内部，则可增加封装性并减少悬空号码牌的可能性

# 条款29：为“异常安全”而努力是值得的（Strive for exception-safe code）

## 异常不安全的案例

```cpp
class PrettyMenu {
public:
	...
  void changeBackground(std::istream& imgSrc) // 改变背景图像
	...
private:
    Mutex mutex;  //互斥器
    Image* bgImage;  //目前使用的背景图片
    int imageChanges;  //图片被修改的次数
};

void PrettyMenu::changeBackground(std::istream& imgSrc) {
	lock(&mutex);  //取得互斥器
	delete bgImage;  //删除旧图片
	++imageChanges;  //修改图像更改次数
	bgImage = new Image(imgSrc);  //安装新的背景图片
	unlock(&mutex);  //释放互斥器
}
```

当异常被抛出时，异常安全函数会（上述代码均不满足）：

- 不泄露任何资源
    - 一旦new Image(imgSrc)异常，则unlock不会被调用，那互斥器将永远锁住
- 不允许数据败坏
    - 若new Image(imgSrc)异常，则bgImage就指向已被删除的对象，imageChanges也已累加，但实际上并没有图像成功安装

## 异常安全函数的保证

异常安全函数提供以下三个保证之一：

- 基本承诺：若异常被抛出，程序内的任何事物仍然保持在有效状态下
- 强烈保证：若异常被抛出，程序状态不改变
    - 若函数成果，就是完全成功；若函数失败，程序会恢复到调用函数之前的状态
- 不抛掷（nothrow）保证：承诺绝不抛出异常，因为它们总是能完成原先承诺的功能
    - 作用于内置类型身上的所有操作都提供nothrow保证

让changeBackground提供接近但非完全的强烈的异常安全保证可考虑以下两点：

- 改变PrettyMenu的bgImage成员变量的类型
    - 改用智能指针
- 重新排列changeBackground内的语句次序
    - 在更换图像之后再累加imageChanges

```cpp
class PrettyMenu {
	...
	std::tr1::shared_ptr<Image> bgImage;
	...
};

void PrettyMenu::changeBackground(std::istream& imgSrc) {
    Lock ml(&mutex);  //将互斥器封装在类中进行管理
    bgImage.reset(new Image(imgSrc));  //以new Image的执行结果设定bgImage内部指针
    ++imageChanges; 
}
```

上述代码删除动作只发生在新图像创建成功之后，shared_tpr::reset函数只有在其参数（即new Image(imgSrc)）成功之后才会被调用。delete在reset内调用，则未进入reset就不会delete。

但是如果Image构造函数抛出异常，则可能输入流（input stream）的读取记号（read marker）已被移走，这对程序其余部分是一种可见的状态改变。

## 强烈的异常安全

**copy and swap可以提供强烈的保证**：

- 如果在副本的身上修改抛出了异常，那么原对象未改变状态。
- 如果在副本的身上修改未抛出异常，那么就将修改过的副本与原对象在不抛出异常的操作中置换（swap）。

实际上通常是将所有隶属对象的数据从原对象放进另一个对象内，然后赋予原对象一个指针，指向那个所谓的实现对象（即副本），其被称为pimpl idiom：

```cpp
struct PMImpl {//将bgImage和imageChanges从PrettyMenu独立出来，封装成一个结构体
  std::tr1::shared_ptr<Image> bgImage;
  int imageChanges
};
class PrettyMenu {
	...
private:
    std::tr1::shared_ptr<PMImpl> pImpl; //创建一个该结构
};
void PrettyMenu::changeBackground(std::istream& imgSrc) {
    using std::swap;  //见条款25
    Lock ml(&mutex);  //获得mutex的副本数据
    std::tr1::shared_ptr<PMImpl> pNew(new PMImpl(*pImpl));
    pNew->bgImage.reset(new Image(imgSrc));  //修改副本
    pNew->imageChanges++;
    swap(pImpl, pNew);  //置换数据，释放mutex
}
```

上述代码将PMImpl定义为一个结构体而不是类

- PrettyMenu的封装性通过pImpl是private来保证
- 把PMImpl定义成类不差，但不太方便
    - PMImpl可以被放在PrettyMenu中，但是要考虑打包问题（packaging）

copy and swap不保证整个函数有强烈的异常安全性：

- 若f1和f2的异常安全性比强烈保证低，则someFunc难以具有强烈的保证
- 若f1和f2均为强烈异常安全，f1成功时程序状态可能改变，则当f2抛出异常时时程序状态和someFunc调用前不同
    - 问题在于连带影响（side effect），函数若只操作局部状态（local state）则易有强烈保证；若对非局部数据（non-local data）有连带影响则难以有强烈保证

```cpp
void someFunc()
{
	...  //对local状态做副本
	f1();
	f2();
	...  //置换修改后的状态
}
```

**Tips：**

- 异常安全函数即使发生异常也不会泄露资源或允许任何数据结构败坏。这样的函数区分三种可能的保证：基本型、强烈型、不抛异常型
- 强烈保证往往能够以copy-and-swap实现出来，但强烈保证并非对所有函数都可实现或具备实现意义
- 函数提供的异常安全保证通常最高只等于其所调用的各个函数的异常安全性中的最弱者

# 条款30：透彻了解inlining的里里外外（Understand the ins and outs of inlining）

过度使用inline的问题：

- 可能增加目标码的大小，使程序体积太大
- 导致额外的换页（paging）行为
- 降低指令高速缓存装置的击中率（instruction cache hit rate）
- 效率降低

申请inline的方式：

- 隐喻的申请：定义于class内
- 明确的申请：使用关键字inline

```cpp
class Person {
public:
  ...
  int age() const { return theAge; }    // 隐喻的inline申请
  ...                                   

private:
  int theAge;
};

template<typename T>                               // 明确申请inline
inline const T& std::max(const T& a, const T& b)   
{ return a < b ? b : a; }                          
```

**inline函数一般必须在头文件内**：

- 大多数建置环境（building environment）在编译期间进行inlining
    - 为了把函数调用替换为被调用的函数本体，编译器必须知道函数长什么样
- 少量例外：
    - 部分建置环境可在连接期inline
    - 少量建置环境，如基于.NET CLI（Common Language Infrastructure，公共语言基础设置）的托管环境，能在运行时inline

**templates一般在头文件内**：

- 编译器需要知道一个template长什么样子以便需要时对它进行实例化
- 存在少量例外，一些构建环境可以在连接期间进行template实例化

**template实例化与inlining无关**：

- 如果所有从template实例化出来的函数都应该inlined，则声明该template为inline
- 如果不需要让template的所有实例化的函数都是inlined，就要避免声明template为inline

**inline是一个编译器可能忽略的请求**：

- 大多数编译器拒绝把复杂的函数inlining（如包含循环或者递归的函数）
- 所有对虚函数的调用（除非是最简单的）也会无法inlining
    - virtual意味着等待，直到运行时再断定哪一个函数被调用
    - inline意味着执行之前，用被调用的函数取代调用的位置
    - 如果编译器不知道哪一个函数将被调用，则拒绝内联这个函数本体

**一个inline函数是否能真是inline，取决于使用的构建环境，主要是编译器**：

- 大多编译器会在无法inline化时发出警告
- 有时编译器有意愿inline，但还是可能生成一个函数本体
    - 出现函数指针时就可能生成函数本体，因为指针不能指向不存在的函数
    - 基类和派生类的构造和析构函数的层层调用会影响是否inline

**inline函数无法随着程序库的升级而升级**：

- 一旦inline函数需要被改变，那所有用到该inline函数的程序都需要重新编译
- 修改non-inline函数则只需要重新连接
    - 若程序库使用动态连接则升级版函数可能在暗中被应用程序采纳

**大部分调试器无法有效调试inline函数**：

- 无法在不存在的函数内设置断点

**Tips：**

- 将大部分inlining（内联化）限制在小型、频繁调用的函数上。这使得程序调试和二进制升级（binary upgradability）更加容易，减小代码膨胀的问题，增大提升程序速度的机会
- 不要仅仅因为function templates出现在头文件中，就将它声明为inline

# 条款31：将文件间的编译依存关系降至最低（Minimize compilation dependencies between files）

## 编译依赖的来源

```cpp
//编译器需要取得其实现代码所用到的classes string、Date、Address的定义
#include <string>
#include "date.h"
#include "address.h"

class Person {
public:
	Person(const std::string& name, const Date& birthday, const Address& addr);
	std::string name() const;
	std::string birthDate() const;
	std::string address() const;
	...
private:
	std::string theName;  // 实现细节
	Date theBirthDate;  // 实现细节
	Address theAddress;   // 实现细节
};
```

Person定义文件和其包含的头文件之间形成了一种编译依存关系（compilation dependency）：

- 任何一个头文件被修改，或者这些头文件依赖的文件被修改，则包含或使用Person类的文件就必须要重新编译
- 这样的连串编译依存关系（cascading compilation dependencies）会导致不好的后果

## 分离类的实现

```cpp
namespace std {
	class string;  // 前置声明（错误！详情见下面叙述）
} 
class Date;  // 前置声明
class Address;  // 前置声明

class Person {
public:
	Person(const std::string& name, const Date& birthday, const Address& addr);
	std::string name() const;
	std::string birthDate() const;
	std::string address() const;
	...
};
```

上述分离方法存在两个问题：

- string不是类，它是一个typedef（定义为basic_string<char>）。因此，对string的前置声明是不正确的。正确的前置声明比较复杂，因为它涉及到了额外的模板
- 在编译过程中编译器需要知道对象的大小

```cpp
int main()
{
	int x;  //定义x，编译器知道为int分配多大的空间足够
	Person *p;  //定义Person，编译器需要询问Person定义式来确定多大的空间足够
	...
}
```

对于Person来说，一种实现方式就是将其分成两个类：

- 一个只提供接口
- 另一个实现接口，命名为PersonImpl

```cpp
#include <string>  //标准程序库组件不该被前置声明
#include <memory>  //此乃为了tr1::shared_ptr而含入，详后

class PersonImpl;  //Person实现类的前置声明
class Date;  //Person接口用到的类的前置声明
class Address;  
                                                                   
class Person {
public:
	Person(const std::string& name, const Date& birthday, const Address& addr);
	std::string name() const;
	std::string birthDate() const;
	std::string address() const;
	...
private:                                                                               
	std::tr1::shared_ptr<PersonImpl> pImpl;  //指向实现物的指针
}; 
```

上述代码中：

- 主类Person只包含了指向类实现的指针（PersonImpl，是tr1::shared_ptr指针）
- 该设计就是通常所说的pimpl idiom（指向实现的指针，是pointer to implementation的缩写）

这实现和接口的真正分离：

- Person的用户完全脱离了datas、address、persons的实现细节，故这些类的实现可以随意修改，但Person用户不需要重新编译
- 用户看不到Person的实现细节，不会写出依赖这些细节的代码

## 分离的关键与编译依存性最小化

这个分离的关键在于**将定义的依存性替换为对声明的依存性**。这是编译依存性最小化的本质：现实中让你的头文件能够自给自足，如果达不到这个要求，依赖其他文件中的声明而不是定义。其他的设计都来自于这个简单的设计策略。因此：

- 如果使用指向对象的引用或指针能够完成任务时就不要使用对象
    - 可以只用一个声明来定义指向一个类型的引用和指针
    - 而定义一个类型的对象则需要使用类的定义。
- 尽量以类的声明替换类的定义
    - 使用类来声明一个函数时绝不会用到这个类的定义

```cpp
//使用按值传递参数或者按值返回（一般这样写不好）也不需要
class Date;  //声明式
Date today();  
void clearAppointments(Date d);  //无需Date的定义式
```

- 为声明和定义提供不同的头文件：
    - 为了符合上述准则，需要两个头文件，一个用于声明，一个用于定义
    - 这些文件应该保持一致，如果有个声明被修改了，两个地方必须同时修改
    - 库的用户应该总是#include一个声明文件，而不是自己对其进行前置声明

```cpp
#include "datefwd.h"  //头文件内声明但未定义Date类
Date today(); 
void clearAppointments(Date d);
```

头文件datefwd.h只包含声明，它的命名是基于标准C++库的头文件<iosfwd>内的iostream组件声明：

- 对应的定义分布在若干不同的头文件内，包括<sstream>、<streambuf>、<fstream>、<iostream>
- 彰显本条款适用于templates和non-templates

> C++中同样提供了export关键字，使模板声明从模板定义中分离出来，但支持export的编译器很少
> 

## 句柄类和接口类

制作句柄类的方法有二：

- 将所有的函数调用转移到对应的实现类中，真正的工作在后续实现类中进行
    - Person构造函数是通过使用new调用PersonImpl构造函数，以及Person::name函数内调用PersonImpl::name，这让Person类变为句柄类但不改变它做的事
- 将Person定义成特殊的抽象基类，也就是接口类，使用这种类的意图是为派生类指定一个接口
    - 这种类没有数据成员，没有构造函数，有一个虚析构函数和一系列纯虚函数
    - 类的客户必须以Person指针或者引用来进行编程，因为不可能实例化包含纯虚函数的类

```cpp
//将所有的函数调用转移到对应的实现类中
#include "Person.h" 
#include "PersonImpl.h"
Person::Person(const std::string& name, const Date& birthday, const Address& addr)
	: pImpl(new PersonImpl(name, birthday, addr))
{}
std::string Person::name() const
{
	return pImpl->name();
}

//将Person定义成特殊的抽象基类，也就是接口类
class Person {
public:
	virtual ~Person();
	virtual std::string name() const = 0;
	virtual std::string birthDate() const = 0;
	virtual std::string address() const = 0;
	...
};
```

这个类的客户必须以Person指针或者引用来进行编程，因为不可能实例化包含纯虚函数的类。（然而实例化Person的派生类却是可能的）。

接口类只有在其接口发生变化的情况下才需要重新编译，其它情况都不需要

接口类的客户为这种类创建新对象的方法：

- 一般调用特殊函数，其扮演派生类构造函数，称为工厂函数或虚构造函数
- 它们返回指向动态分配对象的指针
- 这样的函数在接口类中通常被声明为static

```cpp
class Person {
public:
	...
	static std::tr1::shared_ptr<Person> 
		create(const std::string& name, const Date& birthday, const Address& addr); 
	...
};
//客户这样使用
std::string name;
Date dateOfBirth;
Address address;
...
//创建一个对象，支持Person接口
std::tr1::shared_ptr<Person> pp(Person::create(name, dateOfBirth, address));
...
std::cout << pp->name() << " was born on " << pp->birthDate()
					<< " and now lives at " << pp->address();
...  //pp离开作用域则对象自动删除
```

支持接口类接口的具象类（concrete class）必须定义，且必须调用真正的构造函数，这在包含了虚构造函数实现的文件中都会发生：

```cpp
//比如，Person接口类可有一个具现化派生类RealPerson
class RealPerson: public Person {
public:
	RealPerson(const std::string& name, const Date& birthday,
	const Address& addr)
	:  theName(name), theBirthDate(birthday), theAddress(addr)
	{}
	virtual ~RealPerson() {}
	std::string name() const;  //实现码不显示于此
	std::string birthDate() const;
	std::string address() const;
private:
	std::string theName;
	Date theBirthDate;
	Address theAddress;
};

//给出RealPerson的定义后，很容易实现Person::create
std::tr1::shared_ptr<Person> Person::create(const std::string& name,
																						const Date& birthday,
																						const Address& addr)
{
	return std::tr1::shared_ptr<Person>(new RealPerson(name, birthday, addr));
}
```

## 代价

句柄类：

- 成员函数必须通过implementation指针取得对象数据，则每次访问增加一层间接性，而每个对象消耗的内存数量必须增加implementation指针的大小
- implementation指针必须初始化（在句柄类构造函数内），指向有动态分配得来的implementation对象

接口类：

- 每个函数都是virtual，故每次调用存在简介跳跃（indirect jump）成本
- 接口类派生的对象必须包含vptr，其可能增加存放对象所需的内存（取决于该对象除了接口类之外是否还有其他virtual来源）

句柄类和接口类有以下缺点：

- 会让运行时速度变慢
- 会为每个对象分配额外的空间

**Tips：**

- 将编译依存最小化的一般思路：依赖声明式而非定义式，可用句柄类和接口类实现
- 程序库头文件应该以完全且仅有声明式（full and declaration-only forms）的形式存在，该方式无论是否涉及templates都适用