---
outputDir: /音频/vst3
parentPath: /音频/vst3.html
---

## 啊，多线程...

一碰到多线程这部分我的大脑就不够用了，多线程与单线程的测试相比难度完全不一样，内存安全问题也没有单线程那么简单

### 问题

需要把LFOPointManager里的点从UI线程传给音频线程。LFOPointManager本身没有多线程的能力，所以需要我在外面去实现这一点。为了保证数据的正确性，考虑到点的数量不会太多，我打算把所有的点进行深拷贝，现在问题是[音频线程原则](http://www.rossbencina.com/code/real-time-audio-programming-101-time-waits-for-nothing)上不能进行内存开辟，锁等任何阻塞线程的耗时工作，这是为了保证实时性，所以拷贝的工作是由UI线程来做的，而且传递数据时不能用锁

### Ringbuffer

好在vst3sdk提供了无锁的FIFO缓冲区，让音频线程在不阻塞的前提下实现与ui通信，在`vst3sdk\public.sdk\source\vst\utility\ringbuffer.h`。你也许会注意到教程里有个DataExchange，那个是音频线程向ui线程的，我不知道怎么反过来

~~我有一个想法，创建两个vector，用两个原子标志控制process读取的vector。ui线程编辑完成后对另一个vector进行深拷贝，完成后改变第一个原子标志。process每次读取前会读取第一个标志判断能否切换vector。process切换后改变第二个标志，然后ui线程可以再次编辑~~

这段是我的双指针缓冲的想法，但现在看来并不合适，原因在于ringbuffer其实就是这个想法的升级版

### 是否需要宿主接管？

前面忽略了一个大问题，vst是[支持分布式处理的](https://forums.steinberg.net/t/notifying-controller-of-events/858281/16)，跨设备的时候ringbuffer就没有作用了，这是需要考虑的一点，不过市面上好像很少有专门支持分布式处理的插件。考虑跨设备的话用IMessage来传递信息，现在需要传递的数据量不是特别大

但是IMessage也不能解决一个问题，与ringbuffer不同，IMessage似乎不太适合存储数据，ringbuffer是SPSC（单生产单消费）的模式，ui线程把数据推入，音频线程只需要读就行了，数据是持久保存的。而IMessage我不太清楚，我没仔细看过它的代码，宿主怎么干我也不清楚，但如果音频线程需要拷贝，那就不太合适

不过IMessage也解决了一个比较大的问题，如果使用ringbuffer怎么把ringbuffer的实例传到controller上？可以通过IMessage传递指针，又回到开始的问题了，controller并不一定能通过指针访问到ringbuffer，因为vst是支持分布式处理的。我找到了一篇前ai时代的[博客文章](https://pongasoft.com/blog/yan/vst/2020/12/12/VST3-sharing-technique)，里面用了原子标志shared_ptr配合IMessage来实现通信，里面的shared_ptr用的确实很优雅，可惜效果和我这里用ringbuffer和IMessage传递指针的行为一致（果然一般人包括我如果不用ai都几乎不会注意到vst是支持分布式的，其实市面上很少有插件支持分布式处理），难道我不能在vst的设计原则下解决ui和音频线程通信的问题了吗？

### 可恶，这是无解的吗

现在IMessage不能简单充当ringbuffer使用，ringbuffer不能共享实例到其它线程，音频线程不允许vector深拷贝。难道不能在这几个障碍下完成数据通信吗？实际上是可以的，需要注意音频线程是不允许深拷贝的原因是深拷贝会触发内存分配等耗时操作，解决这个耗时操作无非就是异步这个操作，唉🤓☝🏼那我再创建一个新线程不就可以了。我把想法发给我的测试工具：ai，成功pass succeed！所以就用这个方法

> [!NOTE] 
>IMessage在读取方是事件驱动的，也就是`notify()`是事件驱动的，但我无法得知调用`notify()`这个方法的线程是否有实时要求，因此我不能在`notify()`里进行拷贝

### 一个新的工具类

<!-- 以为我会用ai来写这个工具类？其实我一开始想这样做的，但ai的设计总是过度且复杂的，就那输出的一长串代码，我都不知道它在干什么，想让其简洁又得花很多时间，也不知道怎么用，所以我还是打算自己写。当然我的目的肯定是想弄好整个框架，让ai能在使用最少token的情况下完成一些拓展的工作，只可惜到现在大部分的代码仍然是我这个能工智人手写的 -->
这个做的事情比较单一，直接交给ai，因为多线程这部分我是真没怎么学

### UI端发送数据

还有一个生命周期问题，经过我的一番查找（问ai），在ivsteditcontroller.h，就是IEditController接口里的createView方法里找到了这个注释

>Creates the editor view of the plug-in, currently only "editor" is supported, see \ref ViewType. The life time of the editor view will never exceed the life time of this controller instance. \note [UI-thread & Connected]

关键在于controller的生命周期是比cview的生命周期更长

IMessage的使用方法在[AGain示例](https://github.com/steinbergmedia/vst3_public_sdk/tree/master/samples/vst/again/source)中可以找到。ComponentBase(public.sdk/source/vst/vstcomponentbase.h)拥有发送信息的方法，我选择它的子类EditController。现在CView子类需要通过Editor发送数据，那么CView就要持有EditController的指针，通过构造函数参数列表一层一层注入

LFOView.cpp LFOViewCreator.h等

```cpp
#include "public.sdk/source/vst/vsteditcontroller.h"

namespace Steinberg::Vst
{
	class EditController;
} // 向前声明

// ...
explicit LFOView(const CRect& size, Steinberg::Vst::EditController& editController);
// ...
private:
Steinberg::Vst::EditController& editController;
// ...
```

在需要发送数据的CView子类下新增成员函数

LFOPointView.cpp等

```cpp
int LFOPointView::sentMessage()
{
    if (isEditing()) return 1;
	Steinberg::Vst::IMessage* message = editController.allocateMessage();
	if (!message) return 1;

	message->setMessageID("LFOViewMessage");

	if (auto* attrs = message->getAttributes())
	{
		const auto& points = lfoPointManager.points(); // controlPoints里用controlPoints()
		const void* data = points.data();
		Steinberg::uint32 size = static_cast<Steinberg::uint32>(
			points.size() * sizeof(LFOPoint<float>));

		if (attrs->setBinary("points", data, size) != Steinberg::kResultOk)
		{
			message->release();
			return;
		}

		attrs->setInt("count", static_cast<Steinberg::int32>(points.size()));
	}

	editController.sendMessage(message);
	message->release();

	return 0;
}
```

在`endEdit()`之后调用

LFOPointView.cpp等

```cpp
void LFOPointView::onMouseUpEvent(MouseUpEvent& event)
{
	if (isEditing())
	{
		endEdit();
		sentMessage();
		event.consumed = true;
	}
}
```

### 音频线程接收数据

processor里声明几个成员

processor.h
```cpp
public:
Steinberg::tresult PLUGIN_API notify(Steinberg::Vst::IMessage* message) SMTG_OVERRIDE;
// ...

private:
Steinberg::OneReaderOneWriter::RingBuffer<std::vector<LFOPoint<float>>> lfoPointBuffer{ 8 };
Steinberg::OneReaderOneWriter::RingBuffer<std::vector<LFOPoint<float>>> lfoControlPointBuffer{ 8 };
std::unique_ptr<MessageToRingBuffer> messageToRingBuffer;
std::unique_ptr<MessageToRingBuffer> controlPointMessageToRingBuffer;
std::vector<LFOPoint<float>> points;
std::vector<LFOPoint<float>> controlPoints;
```

这个8是我随便加的，因为信息传输的频率不算高，只有在`endEdit()`的时候才会触发一次，8这个数字足以面对

然后再写上`notify()`和其它东西

processor.cpp
```cpp
// initialize() 里
messageToRingBuffer = std::make_unique<MessageToRingBuffer>(lfoPointBuffer);
controlPointMessageToRingBuffer = std::make_unique<MessageToRingBuffer>(lfoControlPointBuffer);

// terminate() 里
messageToRingBuffer.reset();
controlPointMessageToRingBuffer.reset();

Steinberg::tresult PLUGIN_API YGainProcessor::notify(Steinberg::Vst::IMessage* message)
{
	if (message && Steinberg::FIDStringsEqual(message->getMessageID(), "LFOPointsMessage"))
	{
		messageToRingBuffer->push(message);
		return Steinberg::kResultOk;
	}
	if (message && Steinberg::FIDStringsEqual(message->getMessageID(), "LFOControlPointsMessage"))
	{
		controlPointMessageToRingBuffer->push(message);
		return Steinberg::kResultOk;
	}
	return Steinberg::kResultFalse;
}
```

对了还有初始化，除了LFOEndPointView，构造函数里

LFOPointView.cpp等

```cpp
sendMessage();
```

最后音频线程从ringbuffer中读取点，生成对应曲线。可以根据audiobuffer的大小提前创建好存储样本的数组，没有数据更新时直接读取样本曲线

在`process()`中取出数据

processor.cpp
```cpp
lfoPointBuffer.pop(points);
lfoControlPointBuffer.pop(controlPoints);
```

### 应用到音频中

现在只剩最后一步：求样本曲线。我想到的有两条路径。第一条是插值，之前在LFOCurveView那里用Lerp画出来曲线，可以仿照这个方法，但是自变量是 $t \in [0,1]$，通过它求出来两个点$x_3$和$y_3$在`process()`中无法直接使用，因为$x$作为音频时间轴是单调递增且线性的，无法保证每个$x$都有对应的$x_3$。所以可以考虑插值。第二条是通过$x$的位置解出$y$的位置，我们知道当前这里的$x$和$y$都是关于$t$的参数方程，可以用那个万能的求根公式通过$x$解出$t$，再把$t$代入到$y(t)$里就能求出$y$了

我选择第二条，因为我比较熟悉求根公式

展开一下，这里的$'$不是求导的符号

$$
x_1 = x' + (x_c - x')t
$$

$$
x_2 = x_c + (x'' - x_c)t
$$

所以可以求出$x(t)$

$$
x(t) = x_1 + (x_2 - x_1)t
$$

$$
x(t) = x' + (x_c - x')t + [x_c + (x'' - x_c)t - x' - (x_c - x')t]t
$$

$$
x(t)=x'+2(x_c-x')t+(x''-2x_c+x')t^2
$$

代入到求根公式

$$
t_{1,2}
=
\frac{-2(x_c-x')\pm\sqrt{\left[2(x_c-x')\right]^2-4(x''-2x_c+x')x'}}
{2(x''-2x_c+x')}
$$

把$t$代入到$y(t)$就能求出$y$

$$
y(t) =  y' + 2(y_c - y')t + (y'' - 2y_c + y')t^2
$$

现在按照这个式子的样子写代码就可以了

前面竟然忘了gain在0到1之间了，x的点本身包含范围信息，但是y没有。只能先去`sentMessage()`那个地方改，把@[y归一化](sentMessage2)再发过去

:::sentMessage2
<p>LFOPointView.cpp等</p>

```cpp
int LFOPointView::sentMessage()
{
	if (isEditing()) return 1;

	Steinberg::Vst::IMessage* message = editController.allocateMessage();
	if (!message) return 1;

	message->setMessageID("LFOPointsMessage");

	if (auto* attrs = message->getAttributes())
	{
		const auto& points = lfoPointManager.points();

		const float h = static_cast<float>(getHeight());
		std::vector<LFOPoint<float>> normalized;
		normalized.reserve(points.size());

		for (const auto& p : points)
		{
			const float y01 = (h > 0.f) ? 1 - (p.y / h) : 1.f; //这里反转了
			normalized.push_back(LFOPoint<float>{ p.x, y01 });
		}

		const void* data = normalized.data();
		Steinberg::uint32 size = static_cast<Steinberg::uint32>(
			normalized.size() * sizeof(LFOPoint<float>));

		if (attrs->setBinary("points", data, size) != Steinberg::kResultOk)
		{
			message->release();
			return 1;
		}

		attrs->setInt("count", static_cast<Steinberg::int32>(normalized.size()));
	}

	editController.sendMessage(message);
	message->release();

	return 0;
}
```
:::

最后一个难题，如何对齐

![ping-mu-jie-tu-2026-11-05-133359.png](https://i.postimg.cc/sXLRdSxh/ping-mu-jie-tu-2026-11-05-133359.png)

其实这个图里只是部分，真正的情况就看代码就可以了，完全理解就是增加心智负担

processor.cpp

```cpp
auto* ctx = data.processContext;

double sr = 44100.0;
double tempo = 120.0;
double projectTime = 0.0;
if (ctx)
{
	sr = ctx->sampleRate;
	tempo = ctx->tempo;
	projectTime = ctx->projectTimeMusic;
}
if (sr <= 0.0) sr = 44100.0;

const double P = 4;

double timePosition = std::fmod(projectTime, P);

double bufferNum = P * sr * 60.0 / (data.numSamples * tempo);
double bufferPosition = (bufferNum * timePosition) / P;

if (!points.empty() && !controlPoints.empty() && controlPoints.size() == points.size() - 1)
{
	double width = points.back().x - points.front().x;
	double totalSamples = data.numSamples * bufferNum;
	for (size_t i = 0; i < points.size() - 1; ++i)
	{
		double x1 = points.at(i).x;
		double xc = controlPoints.at(i).x;
		double x2 = points.at(i + 1).x;

		double y1 = points.at(i).y;
		double yc = controlPoints.at(i).y;
		double y2 = points.at(i + 1).y;

		double positionOne = x1 / width * bufferNum;
		double positionTwo = x2 / width * bufferNum;

		if (positionOne <= bufferPosition && positionTwo > bufferPosition)
		{
			for (int32 c = 0; c < data.numSamples; ++c)
			{
				double samplePosition = bufferPosition * data.numSamples + c;
				double t1 = 0.0;
				double t2 = 0.0;
				int rootCount = yzaudiolib::math::quadraticformula::solveQuadratic(x2 - 2 * xc + x1, 2 * (xc - x1), x1 - (samplePosition / totalSamples * width), t1, t2);
				if (rootCount == 1 || rootCount == 2)
				{
					if (t1 > 1) t1 = 1;
					if (t1 < 0) t1 = 0;
					gainValues[c] = y1 + 2 * (yc - y1) * t1 + (y2 - 2 * yc + y1) * t1 * t1;
				}
			}
		}
	}
}
```

总之是写完了，这段也是极其难写，硬控我大半天，这里还没有处理浮点和边界问题，不过是能用的

因为我已经太累了，所以@[下面这段](aicode1)用ai处理边界，经过测试边缘处的杂声确实基本上消除了，简直就是完美的kickstart！

:::aicode1

<p>processor.cpp</p>

```cpp
if (!points.empty() && !controlPoints.empty() && controlPoints.size() == points.size() - 1)
{
	const double width = points.back().x - points.front().x;
	const double totalSamples = (double)data.numSamples * bufferNum;
	const size_t segCount = points.size() - 1;

	double bp = bufferPosition;
	if (bp < 0.0)          bp = 0.0;
	if (bp >= bufferNum)   bp = std::nextafter(bufferNum, 0.0);

	const double invTotalWidth = width / totalSamples;
	const double baseSample = bp * (double)data.numSamples;

	const double xMin = points.front().x;
	const double xMax = points.back().x;

	double* g = gainValues;

	size_t seg = segCount - 1;
	{
		double xPos0 = baseSample * invTotalWidth;
		if (xPos0 <= xMin)
		{
			seg = 0;
		}
		else if (xPos0 >= xMax)
		{
			seg = segCount - 1;
		}
		else
		{
			seg = 0;
			for (size_t i = 0; i < segCount; ++i)
			{
				if (xPos0 < points[i + 1].x) { seg = i; break; }
			}
		}
	}

	double x1 = points[seg].x, xc = controlPoints[seg].x, x2 = points[seg + 1].x;
	double y1 = points[seg].y, yc = controlPoints[seg].y, y2 = points[seg + 1].y;
	double aX = x2 - 2.0 * xc + x1;
	double bX = 2.0 * (xc - x1);

	for (int32 c = 0; c < data.numSamples; ++c)
	{
		double xPos = (baseSample + c) * invTotalWidth;

		if (seg + 1 < segCount && xPos >= x2)
		{
			while (seg + 1 < segCount && xPos >= points[seg + 1].x)
				++seg;

			x1 = points[seg].x;     xc = controlPoints[seg].x; x2 = points[seg + 1].x;
			y1 = points[seg].y;     yc = controlPoints[seg].y; y2 = points[seg + 1].y;
			aX = x2 - 2.0 * xc + x1;
			bX = 2.0 * (xc - x1);
		}

		double t1 = 0.0;
		double t2 = 0.0;
		int rootCount = yzaudiolib::math::quadraticformula::solveQuadratic(
			aX, bX, x1 - xPos, t1, t2);

		if (rootCount == 1 || rootCount == 2)
		{
			if (t1 > 1) t1 = 1;
			if (t1 < 0) t1 = 0;
			g[c] = y1 + 2.0 * (yc - y1) * t1 + (y2 - 2.0 * yc + y1) * t1 * t1;
		}
	}
}
```
:::

果然人费尽心思想出来一个边界有bug的例子，然后根据例子修补，都不如ai力大砖飞来的好。不要忘了ai也是由计算机组成的

后续会进行一下优化处理吧，比如说保存部分样本曲线，进行插值...