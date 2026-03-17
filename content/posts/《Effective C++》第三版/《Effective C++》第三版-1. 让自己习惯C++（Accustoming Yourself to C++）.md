---
title: "《Effective C++》第三版-1. 让自己习惯C++（Accustoming Yourself to C++）"
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

# 条款01：视C++为一个语言联邦（View C++ as a federation of languages）

C++有4个主要的次语言（sublanguage）：

- C。包含区块（blocks）、语句（statements）、预处理器（preprocessor）、内置数据类型（built-in data）、数组（arrays）、指针（pointers）等；没有模板（templates）、异常（exceptions）、继承（inheritance）。
- Object-Oriented C++。这是C with classes部分，包含classes（包括构造函数和析构函数）、封装（encapsulation）、继承（inheritance）、多态（polymorphism）、virtual函数等。
- Template C++。这是C++泛型编程（generic programming）部分。
- STL。涉及容器（containers）、迭代器（iterators）、算法（algorithms）、函数对象（function objects）。

<!--more-->

**Tips：**

- C++高效编程守则视情况而变化，和使用的次语言种类有关

# 条款02：尽量以const、enum、inline替换#define（Prefer consts, enums, and inlines to #define）

该条款可表达为：宁可以编译器替换预处理器

## 替换原因

```cpp
#define ASPECT_RATIO 1.653 
const double AspectRatio = 1.653;  //以常量替换宏
```

替换原因：

- 记号名称ASPECT_RATIO可能在编译器开始处理源码之前被预处理器移走，而未被编译器看到，没有进入记号表（symbol table），故在编译错误涉及该常量时难以确定1.653的来源。使用语言常量AspectRation则不会有这个问题。
- 对浮点常量（floating point constant，如本例），使用常量可能比使用#define导致更少量的码，因为预处理器盲目的将宏名称替换为1.653可能导致目标码（object code）出现多份1.653，改用常量AspectRatio则不会有此问题

## 两种特殊常量

**常量指针（constant pointers）**：常量定义式常位于头文件，故有必要将指针声明为const

```cpp
const char* const authorName = "Scott Meyers";
const std::string authorName("Scott Meyers");  //使用string更合适
```

**class专属常量**：为了将常量作用于（scope）限制在class内，需要让其成为class的一个成员（member）；为了确保此常量至多只有一份实体，需要让其成为static成员

```cpp
class GamePlayer {
private:
	static const int NumTurns = 5;  //常量声明式
	int scores[Numturns];  //使用该常量
	...
};
```

当某个东西是**class专属常量+static+整数类型（integral type，如ints、chars、bools）**，只要不取地址，则可是有声明式而无定义式，否则需要提供定义式。

```cpp
//应放入实现文件而非头文件
const int Gameplayer::NumTurns;  //NumTurns的定义，声明时设定了初值故此处可不设定值
```

旧编译器可能不允许static成员在声明式上获得初值，此时可将初值放在定义式。

```cpp
class CostEstimate {
private:
	static const double FudgeFactor;  //static class常量声明，位于头文件
};
const double CostEstimate::FudgeFactor = 1.35;  //static class常量定义，位于实现文件
```

若译器不允许static成员在声明式上获得初值，且class编译期间需要一个class常量值（如存在数组声明式），则可用**“the enum hack”补偿**，利用**枚举类型（enumerated type）的数值可充当ints使用**的特点。

enum hack有以下特点：

- 取enum地址不合法，可避免存在指向其的pointer或reference，进而不会导致非必要的内存分配
- “enum hack”是template programming（模板元编程）的基础技术

```cpp
class GamePlayer {
private:
	enum { NumTurns = 5 };  //令NumTurns成为5的一个记号名称
	int scores[NumTurns];
	...
};
```

## 形似函数的宏

类似函数的宏（macros）没有函数调用（function call）带来的额外开销，但其缺点显著，最好替换为inline函数

```cpp
//带宏实参的宏，每个实参都需要加上小括号，然而还是可能出现难以预料的问题
#define CALL_WITH_MAX(a, b) f((a) > (b) ? (a) : (b))

//使用template inline实现宏的高效以及函数的可预料性和类型安全性（type safety）
template<typename T>
inline void callWithMax(const T& a, const T& b)
{
	f(a > b ? a : b);
}
```

**Tips：**

- 对于单纯常量，最好用const或enums替换#define
- 对于形似函数的宏，最好用inline函数替换#defines

# 条款03：尽可能使用const（Use const whenever possible）

## const和指针

- 常量指针：const在星号*左边，则被指物是常量
- 指针常量：const在星号*右边，则指针自身是常量

```cpp
void f1(const Widget* pw);  //被指物是常量
void f2(Widget const * pw);  //同上
```

STL迭代器的作用类似T*指针，其同样有指针常量和常量指针的用法

```cpp
std::vector<int> vec;
...
const std::vector<int>::iterator iter = vec.begin();  //指针常量
*iter = 10;  //正确，改变iter所指物
++iter;  //错误！iter本身是const
std::vector<int>::const_iterator cIter = vec.begin();  //常量指针
*cIter = 10;  //错误！*cIter是const
++cIter;  //正确，改变cIter本身
```

## const成员函数

const成员函数有两个作用：

- 使class接口容易被理解
- 使操作const对象成为可能

```cpp
//两个成员函数如果只是常量性（constness）不同，可以被重载
class TextBlock {
public:
	...
	const char& operator[](std::size_t position) const  //对于const对象的操作符[]
	{ return text[position]; }
	char& operator[](std::size_t position)  //对于non-const对象的操作符[]
	{ return text[position]; }
private:
	std::string text;
};

//operator[]使用方式如下
TextBlock tb("Hello");
std::cout << tb{0];  //调用non-const TextBlock::operator[]
tb[0] = 'x';  //正确，写一个non-const TextBlock，operator[]返回reference to char
const TextBlock ctb("World");
std::cout << ctb[0];  //调用const TextBlock::operator[]
ctb[0] = 'x';  //错误！写一个const TextBlock，operator[]调用合法，但对其返回的const赋值非法

//更真实的例子
void print(const TextBlock& ctb)  //此函数中ctb是const
{
	std::cout << ctb[0];  //调用const TextBlock::operator[]
	...
}
```

const成员函数有两个流行概念：

- **bitwise const**（或physical const）：const成员函数不能更改对象的任何成员变量（static除外）
- **logical const**：const成员函数可以修改其所处理的对象内的某些const

当只有指针（而非其所指物）隶属于对象，此时更改了指针所指物的成员函数不具备十足的const性质但编译器认为其满足bitwise const

```cpp
class CtextBlock {
public: 
	...
	char& operator[](std::size_t position) const  //bitwise const声明，但不适当
	{ return pText[position]; }  //operator[]实现代码并不更改pText本身
private:
	char* pText;  //只有指针（而非其所指物）隶属于对象
}

const CTextBlock cctb("Hello");  //声明一个常量对象
char* pc = &cctb[0];  //调用const operator[]获得一个指针，指向cctb的数据
*pc = 'J';  //cctb变为"Jello"
```

当有些量需要修改而违反编译器的bitwise const，则可利用C++的一个与const相关的摆动场：**mutable**，释放掉non-static成员变量的bitwise constness约束

```cpp
class CTextBlock {
public:
 ...
 std::size_t length() const;
private:
	char* pText;
	mutable std::size_t textLength;  //mutable使其可在const成员函数内更改
	mutable bool lengthIsValid;  //否则不能更改，编译器会坚持bitwise const
};
std::size_t CTextBlock::length() const
{
	if (!lengthIsValid) {
		textLength = std::strlen(pText);  //正确，声明时有mutable，否则错误
		lengthIsValid = true;
	}
	return textLength;
}
```

## 在const和non-const成员函数中避免重复

如果non-const和const operator[]相同，则代码会过长。可让non-const operator[]调用const operator[]避免代码重复。这需要将常量性转除（casting away constness）。

```cpp
class TextBlock {
public:
	...
	const char& operator[](std::size_t position) const
	{
		...  //边界检验（bounds checking）
		...  //志记数据访问（log access data）
		...  //检验数据完整性（verify data integrity）
		return text[position];
	}
	char& operator[](std::size_t position)
	{
		return 
			const_cast<char&>(  //将op[]返回值的const转除
				static_cast<const TextBlock&>(*this)  //为*this加上const
					[position]  //调用const op[]
			);
	}
private:
	std::string text;
}
```

上述代码包含两个转型动作：

1. 将*this从其原始类型TextBlock&转型为const TextBlock&，则之后operator[]会调用const版本而非non-const版本。直接在non-const operator[]内部调用operator[]会递归调用自己。
2. 从const operator[]的返回值中移除const。

**在const成员函数中调用non-const成员函数会有风险，因为对象有可能因此被改动。**

**Tips：**

- 将某些东西声明为const可帮助编译器侦测出错误用法。const可被施加于在任何作用域内的对象、函数参数、函数返回类型、成员函数本体
- 编译器强制实施bitwise constness，但编写程序时应该使用概念上的常量性（conceptual constness）
- 当const和non-const成员函数有着实质等价实现时，令non-const版本调用const版本可避免代码重复

# 条款04：确定对象被使用前已先被初始化（Make sure that objects are initialized before they’re used）

- 使用C part of C++且初始化可能导致运行成本，则C++不保证初始化这些对象
- non-C parts of C++的规则有变化

```cpp
int x;  //x在某些语境中会被初始化（为0），但是其他语境中不保证
class Point {
	int x, y;
};
...
Point p;  //p的成员变量有时候被初始化（为0），有时候不会
```

由于是否初始化难以确定，故最好**永远在使用对象之前先将他初始化**，对于内置类型以外的任何东西，**确保每一个构造函数（constructors）都将对象的每一个成员初始化**。

## 成员初值列

```cpp
class PhoneNumber {...};
class ABEntry {  // Addrress Book Entry
public:
	ABEntry(const std::string& name, const std::string& address, 
					const std::list<PhoneNumer>& phones);
private:
	std::string theName;
	std::string theAddress;
	std::list<PhoneNmuber> thePhones;
	int numTimesConsulted;
};
ABEntry::ABEntry(const std::string& name, const std::string& address, 
									const std::list<PhoneNumer>& phones);
{
	theName = name;  //这都是赋值（assignments）而非初始化（initializations）
	theAddress = address;
	thePhones = phones;
	numTimesConsulted = 0;
}
```

上述代码中，theName、theAddress、thePhones在进入ABEntry构造函数之前已经被初始化，而numTimesConsulted则不确定是否已被初始化。

ABEntry构造函数最好使用成员初值列（member initialization list）替换赋值动作

```cpp
ABEntry(const std::string& name, const std::string& address, 
				const std::list<PhoneNumer>& phones);
	:theName(name),   //这些都是初始化
	 theAddress(address),
	 thePhones(phones), 
	 numTimesConsulted(0)
{}  //构造函数本体没有动作

ABEntry();
	:theName(), //也可指定无物（nothing）调用default构造函数
	 theAddress(), 
	 thePhones(), 
	 numTimesConsulted(0)
{}  //构造函数本体没有动作
```

初值列的性能消耗：

- 一般而言，使用成员初值列只调用一次copy构造函数比先调用default构造函数再调用copy assignment操作符更高效
- 对于内置型对象，初始化和赋值的成本相同，但在初值列中初始化可提升一致性

成员初值列的使用建议：

- 总是在初值列中列出所有成员变量，以免还得记住哪些成员变量无需初值
- 如果成员变量是const或reference，则一定要在初值列中初始化，其不能被赋值
- 对于拥有多个构造函数且存在许多成员变量或base classes的classes，可在初值列中省略赋值和初始化的性能消耗相当的成员变量，将它们的赋值移往某个函数（通常是private），供构造函数调用
    - 在成员变量的初值有文件或数据库读入时很有效

## 成员初始化的次序

C++的初始化次序固定为：

- base classes先于derived classes初始化
- class的成员变量按其声明次序初始化

需要额外关注不同编译单元内定义的**non-local static对象**，C++对这类对象的初始化次序无明确定义，故如果这类对象存在依赖关系可能会出问题。决定这类对象的初始化次序非常困难，最常见的形式是经由模板隐式具现化（implicit template instantiations）形成

- **static对象**：其寿命从被构造出来直到程序结束为止，其析构函数在main()结束时被调用，包括global对象、定义余namespace作用域内的对象、在classes内、在函数内、以及在file作用域内被声明为static的对象
    - **local static对象**：函数内的static对象
    - **non-local static对象**：其他static对象
- **编译单元（translation unit）**：产出单一目标文件（single object file）的源码，基本上是单一源码文件加上其所含入的头文件（#include files）

```cpp
//假设自己有一个FielSystem Class
class FileSystem {
public:
	...
	std::size_t numDisks() const;
	...
};
extern FileSystem tfs;
//假设客户在其他位置建立一个class以处理文件系统内的目录
class Directory {
public:
	Directory( *params* );
	...
};
Directory::Directory( *params* )
{
	...
	std::size_t disks = tfs.numDisks();  //使用tfs对象
	...
}
Directory tempDir( *params* );  //放临时文件的目录
```

上述代码无法保证tfs在tempDir之前被初始化

解决方案：**将每个non-local static对象搬到自己的专属函数内并声明为static，这些函数返回一个reference指向它所含的对象**。换句话说，non-local static对象被替换为local static对象，这是[单例（Singleton）模式](https://www.cnblogs.com/sunchaothu/p/10389842.html)的一个常见实现手法。

```cpp
class FileSystem {...};  //同前
FileSystem& tfs()  //初始化一个local static对象并返回指向其的reference
{
	static FileSystem fs;
	return fs;
}
class Directory {...};  //同前
Directory::Directory( *params* )
**{
	...
	std::size_t disks = tfs().numDisks();  //调用tfs函数，而非直接用reference to tfs
}
Directory& tempDir()
{
	static Directoy td;
	return td;
}
```

**reference-returning函数**=定义并初始化一个local static对象+返回它

由于在多线程环境下任何non-const static对象都会有麻烦，则**可在程序的单线程启动阶段（singl-threaded startup portion）手工调用所偶reference-returning函数**，以消除与初始化有关的竞速形式（race conditions）

**Tips：**

- 为内置型对象进行手工初始化，因为C++不保证初始化它们
- 构造函数最好使用成员初值列，而不要在构造函数本体内使用赋值操作。初值列列出的成员变量次序应和class中的声明次序相同
- 为避免跨编译单元的初始化次序问题，请以local static对象替换non-local static对象