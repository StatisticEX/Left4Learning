---
title: "《Effective C++》第三版-4. 设计与声明（Design and Declarations）"
subtitle: ""
date: 2026-03-11
lastmod: 2026-03-11
draft: false
authors: [Yansong Chen]
description: ""
slug: "effective-cpp-3rd-edition-ch4-2026-03-11"

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

# 条款17：让接口容易被正确使用，不易被误用（Make interfaces easy to use correctly and hard to use incorrectly）

## 限制类型和值

```cpp
class Date {
public:
	Date(int month, int day, int year);  //可能月日年顺序错，可能传递无效的月份或日期
	...
};
```
<!--more-->

可使用类型系统（type system）规避以上错误，即引入外覆类型（wrapper type）区别年月日：

```cpp
struct Day {
explicite Day(int d)
	: val(d) { }
int val;
}
struct Month {
explicite Month(int m)
	: val(m) { }
int val;
}
struct Year{
explicite Year(int y)
	: val(y) { }
int val;
}

class Date {
public:
	Date(const Month& m, const Day& d, const Year& y);  //可能月日年顺序错，可能传递无效的月份或日期
	...
};
Date d(Month(3), Day(30), Year(1995));  //可有效防止接口误用
```

保证了类型正确之后，需要保证输入的值有效：

```cpp
class Month {
public:
	static Month Jan() { return Month(1); }
	static Month Feb() { return Month(2); }
	...
	static Month Dec() { return Month(12); }
	...
private:
	explicit Month(int m);
	...
};
Date d(Month::Mar(), Day(30), Year(1995));
```

## 规定能做和不能做的事

```cpp
if ( a * b = c) ...  //以const修饰操作符*，使其不能被赋值
```

## 提供行为一致的接口

为了避免忘记删除或者重复删除指针，可令工厂函数直接返回智能指针：

```cpp
Investment* createInvestment(); //用户可能忘记删除或者重复删除指针
std::tr1::shared_ptr<Investment> createInvestment();
```

若期望用自定义的getRidOfInvestment，则需要避免误用delete，可考虑将getRidOfInvestment绑定为删除器（deleter）：

> 删除器在引用次数为0时调用，故可创建一个null shared_ptr
> 

```cpp
std::tr1::shared_ptr<Investment> createInvestment()
{
	std::tr1::shared_ptr<Investment> retVal(static_cast<Investment*>(0), 
																					getRidOfInvestment);  //创建一个null shared_ptr
	retVal = ... ;  //令retVal指向目标对象
	return retVal;
}
```

若pInv管理的原始指针能在pInv创立之前确定下来，则将原始指针直接传递给pInv的构造函数更好

tr1::shared_ptr会自动使用每个指针专属的删除器，从而无须担心cross-DLL problem：

> **cross-DLL problem**：对象在动态连接程序库（DLL）中被new创建，但在另一个DLL内被delete销毁
> 

```cpp
//返回的tr1::shared_ptr可能被传递给任何其他DLL
//其会追踪记录从而在引用次数为0时调用那个DLL的delete
std::tr1:;shared_ptr<Investment> createInvestment()
{
	return std::tr1::shared_ptr<Investment>(new Stock);
}
```

Boost的tr1::shared_ptr特点：

- 是原始指针的两倍大
- 以动态分配内存作为簿记用途和删除器的专属数据
- 以virtual形式调用删除器
- 在多线程程序修改引用次数时有线程同步化（thread synchronization）的额外开销

**Tips：**

- 好的接口不易被误用
- 促进正确使用的方法包括接口一致性和与内置类型的行为兼容
- 阻止误用的办法包括建立新类型、限制类型上的操作、束缚对象值、消除客户的资源管理责任
- tr1::shared_ptr支持定制型删除器（custom deleter），这可以防范DLL问题，可被用来自动解除互斥锁（mutexes）等

# 条款19：设计class犹如设计type（Treat class design as type design）

定义一个新class时也就定义了一个新type。设计高效的类需要考虑以下问题：

- 新type的对象应如何创建和销毁（第8章））
    - 影响构造函数和析构函数、内存分配函数和释放函数（operator new，operator new []，operator delete，operator delete []）
- 对象的初始化和赋值应有什么差别（条款4）
    - 决定构造函数和赋值操作符的行为
- 新type的对象如果被pass-by-value意味着什么
    - 由copy构造函数定义pass-by-value如何实现
- 什么是新type的合法值
    - 有效的数值集决定了类必须维护的约束条件（invariants），
        - 进而决定了成员函数（特别是构造函数、析构函数、setter函数）的错误检查
    - 还影响函数抛出的异常和极少使用的函数异常明细列（exception specifications）
- 新type需要配合某个继承图系（inheritance graph）吗
    - 继承既有的类，则受那些类束缚，尤其要考虑那些类的函数是否为虚函数
    - 被其他类继承，则影响析构函数等是否为virtual
- 新type需要什么样的转换
    - 若允许类型T1隐式转换为类型T2，可可考虑：
        - 在T1类内写类型转换函数（operator T2）
        - 在T2类内些non-explicit-one-argument（可被单一实参调用）的构造函数
        - 若只允许explicit构造函数存在，就得写专门执行转换的函数，且没有类型转换操作符（type conversion operators）或non-explicit-one-argument构造函数
- 什么样的操作符和函数对于此新type合理
    - 决定需要声明哪些函数，其中哪些是成员函数
- 什么样的标准函数应驳回
    - 这些必须声明为private
- 谁改取用新type的成员
    - 影响public、private、protected的选择
    - 影响[友元类](https://blog.csdn.net/weixin_43107240/article/details/109854018)、友元函数、及其嵌套的设计
- 什么是新type的未声明接口（undeclared interface）
    - 要考虑其对效率、异常安全性、资源运用的保证
- 新type有多么一般化
    - 若要定义整个type家族，则应该定义新的class template
- 是否真的需要新type
    - 若定义新的派生类就足够，则可能定义non-member函数或templates更好

**Tips：**

- Class设计就是type设计，需要考虑以上所有问题

# 条款20：宁以pass-by-reference-to-const替换pass-by-value（Prefer pass-by-reference-to-cons to pass-by-value）

## 避免构造和析构

```cpp
class Person {
public:
	Person();
	virtual ~Person();
	...
private:
	std::string name;
	std::string address;
};
class Student: public Person {
public:
	Student();
	~Student();
	...
private:
	std::string schoolName;
	std::string schoolAddress;
};
bool validateStudent(Student s);  //会调用六次构造函数和六次析构函数
bool validateStudent(const Student& s);  //效率提升很多
```

上述代码validateStudent函数中pass-by-value会调用六次构造函数和六次析构函数：

- Student构造+Person构造+Student的2个string+Person的2个string
- 析构同理

使用pass-by-reference可避免频繁构造和析构

## 避免对象切割

对象切割（slicing）：派生类以值传递并被视为基类对象时，回调用基类的构造函数，而派生类的成分全无

```cpp
class Window {
public:
	...
	std::string name() const;  //返回窗口名称
	virtual void display() const;  //显示窗口和其内容
};
class WindowWithScrollBars: public Window {
public:
	...
	virtual void display() const;
};

void printNameAndDisply(Window w)
{
	std::cout << w,name();
	w.display();
}
WindowWithScrollBars wwsb;
printNameAndDisply(wwsb);  //对象会被切割，因为参数w时Window对象，故调用的Window：：display
void printNameAndDisply(const Window& w)  //不会被切割
{
	std::cout << w,name();
	w.display();
}
```

## 例外

- 内置类型和STL的迭代器与函数对象采用pass by value往往效率更高，
- 小型type不一定适合pass by value
    - 一旦需要复制指针的所指物，则copy构造函数可能成本很高
- 即使小型对象的copy构造函数不昂贵，其效率也存在争议
    - 某些编译器对内置类型和自定义类型的态度截然不同，即使二者底层表示（underlying representation）相同
    - 如可能会把一个double放入缓存器，而只包含一个double的对象则不会
    - by reference则肯定把指针放入缓存器
- 用户自定义类型的大小容易变化，因其内部实现可能改变，故不一定适合pass by value
    - 某些标准程序库实现版本中的string类型比其他版本大七倍

**Tips：**

- 尽量以pass-by-reference-to-const替换pass-by-value。前者通常高效且能避免切割问题
- 以上规则并不适用内置类型和STL的迭代和与函数对象，它们更适合pass-by-value

# 条款21：必须返回对象时，别妄想返回其reference（Don’t try to return a reference when you must return an object）

考虑有理数乘积：

```cpp
class Rational {
public:
	Rational(int numerator = 0, int denominator = 1);
	...
private:
	int n, d;  //分子和分母
	friend const Rational operator* (const Rational& lhs, const Rational& rhs);
};
```

上述代码中操作符*以by value的方式返回值，如果要返回reference则操作符*必须自己创建新Rational对象，其途径有二：在stack或heap空间创建（反例）

```cpp
//返回local对象的引用，但是local对象在离开函数时就销毁了
const Rational& operator* (const Rational& lhs, const Rational& rhs)
{
	Rational result(lhs.n * rhs.n, lhs.d * rhs.d);
	return result;
}

//难以对new创建的对象delete，尤其以下连乘的例子
const Rational& operator* (const Rational& lhs, const Rational& rhs)
{
	Rational* result = new Rational(lhs.n * rhs.n, lhs.d * rhs.d);
	return *result;
}
//无法取得引用背后的指针
Rational w, x, y, z;
w = x * y * z;  //operator*(operator*(x, y), z)
```

若使用static Rational避免调用构造函数，则会有如下问题：

```cpp
//返回local对象的引用，但是local对象在离开函数时就销毁了
const Rational& operator* (const Rational& lhs, const Rational& rhs)
{
	static Rational result;
	result = ... ;
	return result;
}
bool operator==(const Rational& lhs, const Rational& rhs);
Rational a, b, c, d;
...
if ((a * b) == (c * d)) { ... }  //==总是为true
else { ... }  //，因两侧是同一个同一个stetic Rational对象的引用
```

必须返回新对象的函数的正确写法为：

```cpp
inline const Rational& operator* (const Rational& lhs, const Rational& rhs)
{
	return Rational(lhs.n * rhs.n, lhs.d * rhs.d);
}
```

**Tips：**

- 绝不要返回指针或引用指向local stack对象
- 绝对不要返回引用指向heap-allocated对象
- 绝对不要在有可能同时需要多个这样的对象时返回指针或引用指向local static对象

# 条款22：成员变量声明为private（Declare data members private）

*这一条似乎没啥内容^_^*

把成员变量声明为private的原因如下：

- 接口的一致性：非public的成员函数只能通过函数访问，并且可以方便的设置读写权限
- 封装
    - 把成员变量隐藏在函数接口背后，可以方便地更改实现方式
    - public成员变量修改后所有使用它们的客户码都会被破坏
    - protected成员变量修改后所有使用它们的派生类都会被破坏，其并不比public更具有封装性

**Tips：**

- 切记把成员变量声明为private，这个赋予访问数据的一致性、可细微划分访问控制、保证约束条件、提供充分的实现弹性
- protected并不比public更具封装性

# 条款23：宁以non-member、non-friend替换member函数（Prefer non-member non-friend functions to member functions）

考虑有个类表示网页浏览器：

```cpp
class WebBrowser {
public:
	...
	void clearCache();
	void clearHistory();
	void removeCookies();
	void clearEverything();  //执行所有清除动作
	...
};
```

执行所有清除动作由两个方案：

- WebBrowser 提供函数
- 由non-member函数调用相应的member函数
    - 封装性更高，且包裹弹性（packaging flexibility）较大，编译相依度较低，是更好的方案

```cpp
//WebBrowser 提供函数
class WebBrowser {
public:
	...
	void clearEverything();  //执行所有清除动作
	...
};
//由non-member函数调用相应的member函数
void clearBrowser(WebBrowser& wb)
{
	wb.clearCache();
	wb.clearHistory();
	wb.removeCookies();
}
```

两点注意事项：

- 准确地说，封装性良好的是non-member non-friend函数，而非non-member函数
- 一个类的non-member non-friend函数可以是可以是另一个类的member
    - 有些语言的函数必须定义在类内（如Eiffel，Java，C#），可以令clearBrowser成为某个工具类（utility class）的一个static member函数，而非WebBrowser的一部分或friend
    - 在C++中可让clearWebBrowser成为non-member函数且和WebBrowser位于同一命名空间

```cpp
namespace WebBrowserStuff {
	Class WebBrowser { ... };
	void clearBrowser(WebBrowser& wb);
	...
}
```

**命名空间能跨越多个源码文件而类不能**，故可将同一命名空间下不同功能类型的函数放在不同的头文件：

> 标准程序库也不是一个庞大的单一头文件，而是有若干个头文件，每个头文件声明std的某些功能，这样可以使得用户只依赖所使用的一小部分系统
> 

```cpp
//头文件webbrowser.h，包含WebBrowser自身和核心功能
namespace WebBrowserStuff {
class WebBrowser { ... };
	...  //核心功能，如广泛使用的non-member函数
}
//头文件webbrowserbookmarks.h，
namespace WebBrowserStuff {
	...  ////与书签相关的函数
}
//头文件webbrowsercookies.h，
namespace WebBrowserStuff {
	...  //与cookie相关的函数
}

```

**Tips：**

- 宁可拿non-member non-friend函数替换member函数，以增肌封装性、包裹弹性、功能扩展性

# 条款24：若所有参数皆需类型转换，请为此采用non-member函数（Declare non-member functions when type conversions should apply to all parameters）

考虑有理数类：

```cpp
class Rational {
public:
	Rational(int numerator = 0,    //构造函数刻意不为explicit
					 int denominator = 1);  //允许int到Rational的隐式转换
	int numerator() const;  //分子和分母的访问函数
	int denominator() const;
private:
	...
};
```

若操作符*为Rational的成员函数：

```cpp
class Rational {
public:
	...
	const Rational operator* (const Rational& rhs) const;
};
Rational oneHalf(1, 2);
Rational result = oneHalf * 2;  //正确，发生了隐式类型转换，根据int创建了Rational
result = oneHalf.operator*(2);  //但如果是explicit构造函数则错误

result = 2 * oneHalf;  //错误！
result = 2.operator*(oneHalf);  //错误！重写上式，错误一目了然

result = operator*(2, oneHalf);  //错误！本例不存在接受int和Rational的操作符*
```

只有参数位于参数列内，这个参数才能隐式类型转换

要支持混合运算，则可让操作符*成为non-member函数：

```cpp
const Rational operator*(const Rational& lhs, const Rational& rhs)
{
	return Rational(lhs.numerator() * rhs.numerator(),
									lhs.denominator() * rhs.denominator());
```

member函数的反面是non-member函数，而非friend函数

**从Objected-Oriented C++转换到Template C++且Rational是一个class template时，本条款需要考虑新的问题**

**Tips：**

- 若需要为某个函数的所有参数（包括this指针所指的那个隐喻参数）进行类型转换，那这个函数必须是non-member

# 条款25：考虑写出一个不抛异常的swap函数（Consider support for a non-throwing swap）

## 缺省的swap

缺省情况下swap动作可由标准程序库提供的swap算法完成：

```cpp
namespace std {
	template<typename T>  //只要T支持copying即可实现swap
	void swap(T& a, T& b)
	{
		T temp(a);
		a = b;
		b = temp;
	}
}
```

## 特化的swap

缺省的swap涉及三个对象的复制，而pimpl手法（pointer to implementation）可避免这些复制：

> 置换两个Widget对象值只需要置换其pImpl指针；而缺省的swap会复制三个Widget，并且复制三个WidgetImpl对象
> 

```cpp
class Widget {
public:
	Widget(const Widget& rhs);
	Widget& operator=(const Widget& rhs)  //复制Widget时，就复制WidgetImpl对象
	{
		...
		*pImpl = *(ths.pImpl);
		...
	}
	...
private:
	WidgetImpl* pImpl;  //所指对象内涵Widget数据
};
```

将std::swap针对Widget特化可解决上述问题：

> 令Widget声明public swap成员函数做真正的置换工作（采用成员函数是为了取用private pImpl，non-member函数则不行），再把std::swap特化
> 

```cpp
class Widget {
public:
	...
	void swap(Widget& other)
	{
		using std::swap;  //这个声明有必要，稍后解释
		swap(pImpl, other.pImpl);  //真正做置换工作，
	}
	...
};
namespace std {
	template<>  //表示其是std::swap的全特化（total template specialization）版本
	void swap<Widget>(Widget& a, Widget& b)
	{
		a.swap(b);  //要置换WIdget就调用其swap成员函数
	}
}
```

上述代码与STL容器有一致性，因为所有STL容器也都提供有public swap成员函数和std::特化版本（以调用成员函数）

若Widget和WidgetImpl都是class template，可考虑把WidgetImpl内的数据类型参数化：

```cpp
template<typename T>
class WidgetImpl { ... };
template<typename T>
calss Widget { ... };
```

此时特化std::swap会遇到问题：

```cpp
//以下代码企图偏特化（partially specialize）一个function template（std::swap）
//但C++只允许对class template偏特化
//故无法通过编译（虽然少数编译器错误地通过编译）
namespace std {
	template<typename T>
	void swap<Widget<T>>(Widget<T>& a, Widget<T>& b)
	{ a.swap(b);}
}

//偏特化function template时，通常会添加重载版本
//但以下代码也不合法，因为std不能添加新的templates，这由C++彼岸准委员会决定
namespace std {
	template<typename T>
	void swap(Widget<T>& a, Widget<T>& b)  //注意swap之后没有<...>
	{ a.swap(b); }
}
```

解决方案：声明一个non-memebr swap以调用member swap，但不再将non-member swap声明为std::swap的特化版本或重载版本

> 任何代码如果要置换两个Widget对象而调用swap，则C++的名称查找法则（name lookup rules；更具体地说是argument-dependent lookup或Koeing lookup法则）会找到WidgetStuff内的Widget专属版本
> 

```cpp
namespace WidgetStuff {  //为简化，把Widget相关功能都放入WidgetStuff命名空间内
	...
	template<typename T>
	class Widget { ... };
	...
	template<typename T>
	void swap(Widget<T>& a, Widget<T>& b)  //non-member swap函数，不属于std命名空间
	{
		a.swap(b);
	}
}
```

若想要class专属版的swap在尽可能多的语境下被调用，则需呀在该class所在的命名空间内写一个non-member版本和一个std::特化版本，故应该为该class特化std::swap

若希望调用T专属版本，并且在该版本不存在的情况下调用std内的一般化版本，可实现如下：

> C++的名称查找法则确保会找到global作用域或T所在的命名空间内的任何T专属的swap；若没有专属swap则using声明使得能够调用std::swap
> 

```cpp
template<typename T>
void doSomething(T& obj1, T& obj2)
{
	using std::swap;  //令std::swap在此函数内可用
	...
	swap)obj1, obj2);  //为T调用最佳swap版本
	...
}

std::swap(obj1, obj2);  //错误的方式！强迫编译器调用std::swap
```

## 使用swap的总结

swap的使用总结如下：

1. 若缺省的swap的效率可接受，则无需做额外的事
2. 若缺省的swap效率不足，则可考虑：
    1. 提供public swap成员函数，使其置换相应类型的两个对象值，且绝不抛出异常
    2. 在class或template所在的命名空间内提供一个non-member swap，并调用上述swap成员函数
    3. 若正在编写class（而非class template），则特化std::swap并使其调用swap成员函数
3. 若调用swap，则需要包含using声明式，使std::swap在函数内可见，之后不加namespace直接调用swap

**成员版swap绝不可抛出异常**，其最好的应用是帮助class或class template提供强烈的异常安全性（exception-safety）保障

**Tips：**

- 当std::效率不高时，提供一个swap成员函数，并确保其不抛出异常
- 如果提供一个member swap，则要提供一个non-member swap调用前者。对于class（而非template），也最好特化std::swap
- 调用swap时应声明 using std:;swap，之后不带命名空间修饰地调用swap
- 为自定义类型进行std template全特化可以，但是不要再std内加入新东西`