---
title: "《Effective C++》第三版-2. 构造析构赋值运算（Constructors，Destructors，and Assignment Operators）"
subtitle: ""
date: 2026-03-11
lastmod: 2026-03-11
draft: false
authors: [Yansong Chen]
description: ""
slug: "effective-cpp-3rd-edition-ch2-2026-03-11"

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

*由于本书的翻译腔有点佶屈聱牙，从这一章开始lz会增加转述程度使得文本更流畅*

# 条款05：了解C++默默编写并调用哪些函数（Know what functions C++ silently writes and calls）

## 自动生成的函数

空类（empty class）会由编译器自动声明一个**copy构造函数、**一个**copy assignment操作符、**一个**析构函数，**若未手动声明构造函数则还会自动生命一个**default构造函数**

<!--more-->

```cpp
class Empty {};  //写一个空类则编译器会自动处理为如下形式
class Empty {
public:  //以下编译器声明的函数均为public且inline
	Empty() { ... }  //default构造函数
	Empty(const Empty& rhs) { ... }  //copy构造函数
	~Empty() { ... }  //析构函数
	Empty& operator=(const Empty& rhs) { ... }	//copy assignment操作符
};
```

编译器声明的函数的作用：

- default构造函数和析构函数：用以调用幕后的代码，如调用基类和非静态成员变量的构造函数和析构函数
    - default析构函数不是虚函数，除非该类的基类的析构函数声明为虚函数
- copy构造函数和copy assignment操作符：单纯将来源对象的每个非静态变量拷贝到目标对象

## 举例说明

```cpp
template<typename T>
class NameObject {
public:
	NameObject(const char* name, const T& value);
	NameObject(const std::string& name, const T& value);
	...
private:
	std::string nameValue;
	T objectValue;
};

NameObject<int> no1("Smallest Prime Number", 2);
NameObject<int> no2(no1);`
```

上述代码涉及no2的nameValue和objectValue两个成员变量的初始化：

- nameValue：string类型，调用标准string的构造函数并以no1.nameValue为实参
- objectValue：int类型（此处T代表int），拷贝no1.objectValue的每个bits

```cpp
template<typename T>
class NameObject {
public:
	//nameValue是non-const string的引用，故以下构造函数不再接受const名称
	NameObject(std::string& name, const T& value);
	...  //假设并未声明operator=
private:
	std::string& nameValue;  //这里是引用
	const T objectValue;
};

std::string newDog("Persephone");
std::string oldDog("Satch");

NameObject<int> p(newDog, 2);
NameObject<int> s(oldDog, 2);`
//以下p.nameValue无法改指向s.nameValue所指的string因为C++不允许让引用改指向不同对象
p = s;  
```

上述代码说明：一般而言只有当生成的代码合法且有机会证明它有意义，编译器才会生成操作符=

- 若要在包含引用或const成员的类里面支持复制操作，租需要自己定义copy assignment操作符
- 若基类将copy assignment操作符声明为private，编译器不会为其派生类生成copy assignment操作符
    - 编译器为派生类生成的copy assignment操作符会预设其可以处理基类的成分，而其又无法调用派生类无权调用的成员函数

**Tips：**

- 编译器可以暗自为类创建default构造函数、copy构造函数、copy assignment操作符、析构函数

# 条款06：若不想使用编译器自动生成的函数，就该明确拒绝（Explicitly disallow the use of compiler-generated functions you do not want）

通常不希望类支持某一功能则不声明对应的函数即可，但是对于copy构造函数和copy assignment操作符（编译器会自动生成它们）则需要**将成员函数声明为private且不实现它们**

```cpp
class HomeForSale {
public:
	...
private:
	...
	HomeForSale(const HomeForSale&);  //只声明不实现
	HomeForSale& operator=(const HomeForSale);
};
```

上述代码在拷贝HomeForSale对象时编译器会报错，即使在[成员函数](https://www.runoob.com/cplusplus/cpp-class-member-functions.html)和[友元函数](https://www.runoob.com/cplusplus/cpp-friend-functions.html)之内拷贝则连接器也会报错。

进一步，可将连接期错误转移至编译器（好事，越早检测出错误越好），只要将copy构造函数和copy assignment操作符在一个专门为阻值copying动作而设计的基类中声明为private即可。

> 成员函数或友元函数拷贝HomeForSale对象时，编译器生成的copy构造函数和copyassignment操作符会调用基类的private拷贝函数，则编译器会报错
> 

```cpp
class Uncopyable {
protected:  //允许派生对象构造和析构
	Uncopyable() {}
	~Uncopyable() {}
private:
	Uncopyable(const Uncopyable&);  //但阻止copying
	Uncopyable& operator=(const Uncopyable&);
};

class HomeFOrSale: private Uncopyable {  //继承Uncopyable
	...  //不再声明copy构造函数或copy assign.操作符
};
```

Uncopyable类使用的注意事项：

- 不一定得以public继承它
- 其析构函数不一定得是虚函数
- 其不含数据，符合[空基类优化（empty base class optimization）](https://blog.csdn.net/haokan123456789/article/details/136333944#:~:text=C%2B%2B%E6%83%AF%E7%94%A8%E6%B3%95%E4%B9%8B%E7%A9%BA%E5%9F%BA%E7%B1%BB%E4%BC%98%E5%8C%96%201%201.%E7%A9%BA%E7%B1%BB%20C%2B%2B%20%E4%B8%AD%E6%AF%8F%E4%B8%AA%E5%AF%B9%E8%B1%A1%E7%9A%84%E5%AE%9E%E4%BE%8B%E9%83%BD%E5%8F%AF%E4%BB%A5%E9%80%9A%E8%BF%87%E5%8F%96%E5%9C%B0%E5%9D%80%E8%BF%90%E7%AE%97%E7%AC%A6%E8%8E%B7%E5%8F%96%E5%85%B6%E5%9C%A8%E5%86%85%E5%AD%98%E5%B8%83%E5%B1%80%E4%B8%AD%E7%9A%84%E5%BC%80%E5%A7%8B%E4%BD%8D%E7%BD%AE%EF%BC%8C%E5%9B%A0%E6%AD%A4%E6%AF%8F%E4%B8%AA%E7%B1%BB%E5%AF%B9%E8%B1%A1%E8%87%B3%E5%B0%91%E9%9C%80%E8%A6%81%E5%8D%A0%E7%94%A8%E4%B8%80%E4%B8%AA%E5%AD%97%E8%8A%82%E7%9A%84%E7%A9%BA%E9%97%B4%E3%80%82%20%E7%A9%BA%E7%B1%BB%E6%98%AF%E6%8C%87%E4%B8%8D%E5%8C%85%E5%90%AB%E9%9D%9E%E9%9D%99%E6%80%81%E6%95%B0%E6%8D%AE%E6%88%90%E5%91%98%E7%9A%84%E7%B1%BB%EF%BC%8C%E4%BD%86%E6%98%AF%E5%8F%AF%E4%BB%A5%E5%8C%85%E5%90%AB%E6%88%90%E5%91%98%E5%87%BD%E6%95%B0%E5%8F%8A%E9%9D%99%E6%80%81%E6%88%90%E5%91%98%E3%80%82%20...%202,3.%E5%86%85%E5%AD%98%E5%B8%83%E5%B1%80%E5%8E%9F%E5%88%99%20C%2B%2B%E7%9A%84%E8%AE%BE%E8%AE%A1%E8%80%85%E4%B8%8D%E5%85%81%E8%AE%B8%E7%B1%BB%E7%9A%84%E5%A4%A7%E5%B0%8F%E4%B8%BA0%EF%BC%8C%E5%85%B6%E5%8E%9F%E5%9B%A0%E6%9C%89%E5%BE%88%E5%A4%9A%EF%BC%8C%E6%AF%94%E5%A6%82%E7%94%B1%E5%AE%83%E4%BB%AC%E6%9E%84%E6%88%90%E7%9A%84%E6%95%B0%E7%BB%84%EF%BC%8C%E5%85%B6%E5%A4%A7%E5%B0%8F%E5%BF%85%E7%84%B6%E4%B9%9F%E6%98%AF0%EF%BC%8C%E8%BF%99%E4%BC%9A%E5%AF%BC%E8%87%B4%E6%8C%87%E9%92%88%E8%BF%90%E7%AE%97%E4%B8%AD%E6%99%AE%E9%81%8D%E4%BD%BF%E7%94%A8%E7%9A%84%E6%80%A7%E8%B4%A8%E5%A4%B1%E6%95%88%E3%80%82%20%E6%AF%94%E5%A6%82%EF%BC%8C%E5%81%87%E8%AE%BE%E7%B1%BB%E5%9E%8BZeroSizedT%E7%9A%84%E5%A4%A7%E5%B0%8F%E4%B8%BA0%EF%BC%8C%E5%88%99%E4%B8%8B%E9%9D%A2%E7%9A%84%E6%93%8D%E4%BD%9C%E4%BC%9A%E5%87%BA%E7%8E%B0%E9%94%99%E8%AF%AF%EF%BC%9A%20...%204%204.%E5%AE%9E%E4%BE%8B%E5%88%86%E6%9E%90%20std%3A%3Atuple%E5%AE%9E%E9%99%85%E4%B9%9F%E5%BA%94%E7%94%A8%E4%BA%86%E7%A9%BA%E5%9F%BA%E7%B1%BB%E4%BC%98%E5%8C%96%2C%E5%A6%82%EF%BC%9A%20)条件；但其常作为基类，可能需要多重继承（还需要继承其他类），而多重继承有时会阻止空基类优化
- 也可使用Boost提供的noncopyable类

**Tips：**

- 为了避免编译器自动生成的功能，可将相应的成员函数声明为private并且不予实现
- 使用像Uncopyable这样的基类也可以

# 条款07：为多态基类声明virtual析构函数（Declare destructors virtual in polymorphic base classes）

## virtual析构函数的作用

以计时器为例，用户只想在程序中使用时间而非了解计算细节，故可实际[工厂函数](https://zhuanlan.zhihu.com/p/83535678)，其返回一个基类指针，指向新生成的派生类对象

```cpp
class TimeKeeper {
public:
	TimeKeeper();
	~TimeKeeper();
	...
};
class AtomicClock: public TimeKeeper {...};  //原子钟
class WaterClock: public TimeKeeper {...};  //水钟
class WristClock: public TimeKeeper {...};  //腕表

TimeKeeper* getTimeKeeper();  //工厂函数，返回指针指向一个TimeKeeper派生类的动态分配对象
TimeKeeper* ptk = getTimeKeeper();  //从TimeKeeper继承体系获得一个动态分配对象
...
delete ptk;  //释放，避免资源泄漏
```

上述代码存在问题：getTimeKeeper返回的指针指向一个派生类对象，但是那个对象却经由一个基类指针（如TimeKeeper*指针）被删除，而当前的基类有non-virtual析构函数，则**实际执行时对象派生的成分未被销毁**

解决方案：**给基类一个virtual析构函数**，则删除派生类时会销毁整个对象

```cpp
class TimeKeeper {
public:
	TimeKeeper();
	virtual ~TimeKeeper();  //virtual析构函数
	...
};
TimeKeeper* ptk = getTimeKeeper();
...
delete ptk;  //行为正确
```

## Virtual析构函数的缺点

**当类不作为基类时，令其析构函数为虚函数往往不好**：

```cpp
class Point {
public:
	Point(int xCoord, int yCoord);
	~Point();
private:
	int x, y;
};
```

- 没有虚函数时，若int占用32 bits，则Point对象可放入64-bit缓存器重，甚至可当做64-bit量传给其他如C或FORTRAN等语言写的函数
- 要实现虚函数则对象必须携带额外的信息，用以在运行期间决定哪个虚函数该被调用，故其对象体积会增加
    - 额外的信息：
        - 信息载体为vptr（virtual table pointer）指针
        - vptr指针指向一个由函数指针构成的数组，即vtbl（virtual table）
        - 每个带有虚函数的类都有一个相应的vtbl
        - 调用某一虚函数时实际被调用的函数取决于该对象的vptr所指的vpbl，即编译器在其中寻找对应的函数指针
    - 增加的体积：
        - 在32-bit计算机体系结构中将占用64 bits（两个ints）至96 bits（两个ints和vptr）
        - 在64-bit计算机体系结构中将占用64~128 bits（此时vptr占64 bits）
        - 对象大小将增加50%~100%
    - 由于其他语言没有vptr，故不能直接将其传递至其他语言所写的函数，不再具有移植性

# Non-virtual析构函数的问题

**不要继承带有non-virtual析构函数的类**（如STL容器）

```cpp
class SpecialString: public std::string {...};  //不好！std::string有non-virtual析构函数
SpecialString* pss = new SpecialString("Impeding Doom");
std::string* ps;
...
ps = pss;  //SpecialString* => std::string
...
delete ps;  //未有定义！*ps的SpecialString资源会泄漏，因为SpecialString析构函数未被调用
```

可以考虑**声明一个pure virtual析构函数从而创建一个抽象（abstract）类**，其常用作基类且不能被实例化（instantiated）

```cpp
class AWOV {  //AWOV="Abstract w/o Virtuals"
public:
	virtual ~AWOV() = 0;  //声明pure virtual析构函数
};
AWOV::~AWOV() { }  //**必须定义pure virtual析构函数**
```

析构函数的运作方式：

- 最先调用最深层派生（most derived）的类的析构函数
- 再调用每个基类的析构函数
- 编译器会在AWOV的派生类的析构函数中创建一个对~AWOV的调用动作，因此需要定义该函数，否则连接器会报错

给基类一个virtual析构函数的规则只适用于带多态性质（polymorphic）的基类，其设计目的是通过基类接口处理派生类对象；并非所有基类的设计目的都是为了多态用途，如标准string和STL容器

**Tips：**

- 带多态性质的基类应声明一个virtual析构函数；带有virtual函数的类也应该有virtual析构函数
- 若不作为基类或不需要多态性，这个类就不该声明virtual析构函数

# 条款08：别让异常逃离析构函数（Prevent exceptions from leaving destructors）

## 析构函数抛出异常的影响

**最好不要让析构函数抛出异常**，以如下代码为例：

- vector v被销毁时，需要销毁其含有的所有Widgets（调用其析构函数），不妨假设有十个Widgets
- 假设销毁时前两个Widgets的析构函数都抛出了异常，两个异常会使程序终止或导致不明确行为
- 使用STL容器或TR1的任何容器或array，也会有相同情况

```cpp
class Widget {
public:
	...
	~Widget() {...}  //假设这里可能抛出异常
};
void doSomething()
{
	std::vector<Widget> v;
	...
}  //v在这里被自动销毁
```

## 析构函数抛出异常的处理

若析构函数必须执行可能抛出异常的动作（如下面的close）：

```cpp
class DBConnection {
public:
	...
	static DBConnection create();
	void close();  //关闭联机，失败则抛出异常
};

class DBConn {  //用这个类管理DBConnection对象，确保不会忘记关闭联机
public:
	...
	~DBConn()  //确保数据库连接总会被关闭
	{
		db.close();
	}
private:
	DBConnection db;
};
//用户可使用如下
{  //开启区块（block）
DBConn dbc(DBConnection::create());  //建立DBConnection对象，由DBConn对象管理
...  //通过DBConn接口使用DBConnection对象
}  //在区块结束点DBConn对象被销毁而自动调用DBConnection对象的close
```

有两种方法避免close抛出异常而导致麻烦：

```cpp
//抛出异常就结束程序
DBConn::~DBConn()
{
	try { db.close(); }
	catch (...) {
		...  //记录调用失败的日志
		std::abort();  //强制终止程序，防止异常传播
	}
}
//吞下异常
DBConn::~DBConn()
{
	try { db.close(); }
	catch (...) {
		...  //记录调用失败的日志
	}
}
```

更好的方式是重新设计DBConn接口使客户能对潜在的问题做出反应：

> 如果某个操作可能抛出异常，而又必需处理该异常，则该异常必须来自析构函数以外的函数
> 

```cpp
class DBConn {
public:
	...
	void close()  //供客户使用的新函数
	{
		db.close();
		closed = true;
	}
	~DBConn()
	{
		if (!closed) {
			try {
				db.close();
			}
			catch (...) {
				...  //记录调用失败的日志
			}
		}
	private:
		DBConnection db;
		bool closed;
	}
```

**Tips：**

- 析构函数决不能抛出异常。若析构函数调用的函数可能抛出异常，则析构函数应捕捉任何异常，并吞下它们（不传播）或结束程序
- 若需要处理某个操作函数运行期间抛出的异常，则类应该提供一个普通函数（而非在析构函数中）处理

# 条款09：绝不在构造和析构函数中调用virtual函数（Never call virtual functions during construction or deconstruction）

## 使用后果

*这一段代码太多懒得敲了*

**不要再构造函数和析构函数期间调用virtual函数**，否则很可能出现预期外的结果

- 在基类构造期间，虚函数不是虚函数
    - 派生类对象内的基类成分会在派生类自身成分构造之前先构造妥当
    - 在基类构造期间虚函数绝不会下降到派生类阶层
- C++不允许使用对象内部尚未初始化的部分
    - 在基类构造期间，若虚函数下降至派生类阶层，很可能会取用尚未初始化的local变量
- 在派生类对象的基类构造期间，对象的类型是基类而非派生类
    - 虚函数会被编译器解析至（resolve to）基类
    - 运行类型信息（runtime type information，如dynamic_cast和typeid）也会把对象视为基类
- 在派生类对象析构完派生类成员变量之后，这些成员变量便呈现未定义值，进入基类析构函数后对象便成为一个基类对象

## 解决方案

以下代码通常不会让编译器和连接器报错，logTransaction是Transaction内的纯虚函数，其被调用时大多执行系统会终止程序；若logTransaction是虚函数且在Transaction内有一份实现代码，该版本就会被调用，即在建立派生类时调用错误版本的logTransaction 

```cpp
class Transaction {
public:
	Transaction()
	{ init(); }  //有多个构造函数且执行某些相同的工作，可将相同部分放入init避免代码重复
	virtual void logTransaction() const = 0;    //调用non-virtual
	...
private:
	void init()
	{
		...
		logTransaction();  //这里调用virtual
	}
};
```

为了保证每次有Transaction继承体系上的对象被创建，就会有适当版本的logTransaction被调用，可在Transaction类内将logTransaction改为non-virtual，并要求派生类构造函数传递必要的信息给Transaction构造函数，之后便可安全地调用non-virtual logTransaction

> 换言之，由于无法使用虚函数从基类向下调用，在构造期间可以让派生类将必要的构造信息向上传递至积累构造函数
> 

```cpp
class Transaction {
public:
	explicit Transaction(const std::string& logInfo);
	void logTransaction(const std::string& logInfo) const;  //non-virtual函数
	...
};
Transaction::Transaction (const std::string& logInfo)
{
	...
	logTransaction(logInfo);  //non-virtual调用
}
class BuyTransaction: public Transaction {
public:
	BuyTransaction( params **)
		: Transaction(createLogString( *params* ))  //将log信息传给基类构造函数
	{ ... }
	...
private:
	static std::string createLogString( *params* );
}.
```

**Tips：**

- 在构造和析构期间不要调用虚函数，因为这类调用从不下降至派生类（就当前执行构造函数和析构函数的那层而言）

# 令operator=返回一个reference to *this（Have assignment operators return a reference to *this）

```cpp
int x, y, z;
x = y = z = 15;  //赋值连锁形式
x = (y = (z = 15));  //赋值采用右结合律，上述赋值被解析为左式
```

为实现连锁赋值，赋值操作符需要樊麾指向操作符左侧实参的引用，其他所有与赋值相关的运算也适用该规则（但此规则并无强制性，即使不遵循编译器也不报错）

```cpp
class Widget {
public:
	...
	Widget& operator=(const Widget& rhs)
	{
		...
		return* this;  //返回左侧对象的引用
	}
	...
};

class Widget {
public:
	...
	Widget& operator+=(const Widget& rhs)  //适用于+=，-=，*=等
	{
		...
		return* this;
	}
	Widget& operator=(int rhs)  //适用，即使此操作符的参数类型不符协定
	{
		...
		return* this;
	}
	...
};
```

**Tips：**

- 令赋值操作符返回指向*this的引用

# 条款11：在operator=中处理“自我赋值”（Handle assignment to self in operator）

## 别名导致的现象

考虑以下现象：

- 自我赋值合法
- 来自同一继承体系的两个对象可能实际指称同一对象

```cpp
class Widget { ... };
Widget w;
...
w = w;  //赋值给自己
//潜在的自我赋值
a[i] = a[j];  //若i=j
*px = *py;  //若px和py指向同一个东西

class Base { ... };
class Derived: public Base { ... };
void doSomething(const Base& rb, Derived* pd);  //rb和*pd可能指向同一对象
```

以上现象是**别名（aliasing）**导致的，别名即有多个方法指称某对象

## 安全性问题

自我赋值的安全性：

- 使用对象来管理资源，且该对象在copy发生时有正确的举措，则是自我赋值安全的（self-assignment safe）
- 若要自行管理资源（自己写管理资源的类），则要注意不能在通知使用之前释放它

```cpp
class Bitmap { ... };
class Widget {  //不安全的操作符=实现版本，不具备自我赋值安全性和异常安全性
	...
private:
	Bitmap* pb;  //指针，指向一个从heap分配而得的对象
};
Widget& Widget::operator=(const Widget& rhs)  //不安全的操作符=实现版本
{
	delete pb;  //停止使用当前的bitmap
	pb = new Bitmap(*rhs.pb);  //使用rhs的bitmap的副本
	return *this;  //*this和rhs可能是同一个对象，则可能rhs的bitmap已被销毁
}
```

可以增加证同测试（identity test）实现自我赋值安全性，但有以下缺点：

- 使代码变大（包括原始码和目标码）
- 导入新的控制流（control flow）分支
- 二者会导致执行速度减低，prefetching、caching、pipelining等指令的效率都会降低
- 不保证异常安全性

```cpp
Widget& Widget::operator=(const Widget& rhs)  //不安全的操作符=实现版本
{
	if (this == &rhs) return *this;  //证同测试
	delete pb;  //停止使用当前的bitmap
	pb = new Bitmap(*rhs.pb);  //new Bitmap异常可能使指针指向一块被删除的Bitmap
	return *this; 
}
```

实现异常安全性往往能兼顾自我赋值安全性，其方法有：

- 赋值pb所指的东西之前别删除pb
- copy and swap技术
- 直接pass by value
    - 牺牲了可读性，但是把copying动作从函数本体移到函数参数构造阶段可能使编译器生成更高效的代码

```cpp
//赋值pb所指的东西之前别删除pb
Widget& Widget::operator=(const Widget& rhs)  //不安全的操作符=实现版本
{
	Bitmap* pOrig = pb;  //保存原pb
	pb = new Bitmap(*rhs.pb);  //令pb指向*pb的副本
	delete pOrig;  //删除原pb
	return *this;
}

//也可用copy and swap技术
class Widget {  
	...
	void swap(WIdget& rhs);  //交换*this和rhs的数据
	...
};
Widget& Widget::operator=(const Widget& rhs) 
{
	Widget temp(rhs);  //制作rhs的副本
	swap(temp);  //交换*this和上述副本
	return *this;
}

//pass by value，直接传递副本
Widget& Widget::operator=(Widget rhs) 
{
	swap(rhs);  //交换*this和上述副本
	return *this;
}
```

**Tips：**

- 确保对象自我赋值时操作符=有良好行为。可以考虑证同测试、语句顺序调整、copy and swap等相关技术
- 确保任何函数如果操作多个对象，而其中部分是同一对象时，其行为仍然正确

# 条款12：复制对象时勿忘其每一个部分（Copy all parts of an object）

## Copying函数易出现的问题

copying函数的版本：

- 编译器自动生成版：将拷贝对象的所有成员变量都拷贝一份
- 自定义版：当类的成员变量变化时， 需要修改copying函数

```cpp
class PriorityCustomer: public Customer {
public:
	...
	PriorityCustomer(const PriorityCustomer& rhs);
	PriorityCustomer& operator=(const PriorityCustomer& rhs);
	...
private:
	int priority;
};
PriorityCustomer::PriorityCustomer(const PriorityCustomer& rhs)
	: priority(rhs.priority)
{
	logCall("PriorityCustomer copy constructor");
}
PriorityCustomer& PriorityCustomer::operator=(const PriorityCustomer&rhs)
{
	logCall("PriorityCustomer copy assignment operator");
	priority = rhs.priority;
	return *this;
}
```

PriorityCustomer的copying函数未复制其继承的Customer成员变量副本

- PriorityCustomer的copy构造函数并没有制定实参传给其基类构造函数（成员初值列未提到Customer）
- PriorityCustomer对象的Customer成分会被Customer不带实参的default构造函数初始化
- 对于copy assignment操作符情况类似，只是不改变其基类的成员变量

## Copying函数的正确写法

正确写法：**复制所有local成员变量+调用所有基类内适当的copying函数**

> 不应使copy assignment操作符调用copy构造函数；也不应使copy构造函数调用copy assignment操作符
> 

```cpp
PriorityCustomer::PriorityCustomer(const PriorityCustomer& rhs)
	: Customer(rhs)  //调用基类的copy构造函数
		priority(rhs.priority)
{
	logCall("PriorityCustomer copy constructor");
}
PriorityCustomer& PriorityCustomer::operator=(const PriorityCustomer&rhs)
{
	logCall("PriorityCustomer copy assignment operator");
	Customer::operator=(rhs);  //对基类成分赋值
	priority = rhs.priority;
	return *this;
}
```

**Tips：**

- Copying函数应确保赋值对象内的所有成员变量和所有基类成分
- 不要尝试以某个copying函数实现另一个copying函数。用把共同的功能放进第三个函数中，并由两个copying函数共同调用