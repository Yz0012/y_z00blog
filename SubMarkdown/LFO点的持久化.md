---
outputDir: /音频/vst3
parentPath: /音频/vst3.html
---

### 持久化

经过测试发现UI关闭后，CView子类会析构，重新加载后又重新实例化，之前的点都消失了。所以有必要进行持久化处理

首先，析构的只是CView，controller在UI关闭时并没有被析构，首先保证LFOPointManager不被析构，所以我将LFOPointManager移到controller这里，再注入到LFOView这个CViewContainer里面。现在CViewContainer的构造函数里面不是硬编码地创建LFOPoint了，稍微改一改

注入的代码就不用看了

LFOPointView.cpp

```cpp
LFOView::LFOView(const CRect& size, Steinberg::Vst::EditController& editController, LFOPointManager<float>& lfoManager)
	: CViewContainer(size)
	, editController(editController)
	, curveColor(kBlueCColor)
	, bgColor(kBlackCColor)
	, amplitude(0.4f)
	, frequency(2.0f)
	, lfoPointManager(lfoManager)
{
	curveView = new LFOCurveView(getViewSize(), lfoPointManager, [this](int pointIndex) {return addOView(pointIndex);}, editController);
	addView(curveView, getViewSize(), true);

	CRect r1(lfoPointManager.points().front().x - pointRadius
		, lfoPointManager.points().front().y - pointRadius
		, lfoPointManager.points().front().x + pointRadius
		, lfoPointManager.points().front().y + pointRadius);
	addView(new LFOEndPointView(CRect(0, 0, getViewSize().getWidth(), getViewSize().getHeight()), pointRadius, lfoPointManager, editController), r1, true);

	for (size_t i = 0; i < lfoPointManager.controlPoints().size(); ++i)
	{
		CRect r(lfoPointManager.controlPoints().at(i).x - controlPointRadius
			, lfoPointManager.controlPoints().at(i).y - controlPointRadius
			, lfoPointManager.controlPoints().at(i).x + controlPointRadius
			, lfoPointManager.controlPoints().at(i).y + controlPointRadius);
		lfoControlPointViews.emplace_back(new LFOControlPointView(CRect(0, 0, getViewSize().getWidth(), getViewSize().getHeight()), i, controlPointRadius, lfoPointManager, editController));
		addView(lfoControlPointViews.back(), r, true);
	}

	for (size_t i = 1; i < lfoPointManager.points().size() - 1; ++i)
	{
		CRect r(lfoPointManager.points().at(i).x - pointRadius
			, lfoPointManager.points().at(i).y - pointRadius
			, lfoPointManager.points().at(i).x + pointRadius
			, lfoPointManager.points().at(i).y + pointRadius);
		lfoPointViews.emplace_back(new LFOPointView(CRect(0, 0, getViewSize().getWidth(), getViewSize().getHeight()), i, pointRadius, lfoPointManager, editController));
		lfoPointViews.back()->setCallback([this](int pointIndex) {return deletePoint(pointIndex);});
		addView(lfoPointViews.back(), r, true);
	}
}
```

ok现在经过测试，重开UI的时候曲线已经保持不变了。不过还有一部分，比如说打开工程后插件里的参数不会全部重置，现在来做这种持久化。之前在跟着教程做Gain的时候看到过IBStream这个接口，现在用这个接口保存数据

下面几个是controller已经写好的方法，setComponentState和setState的区别[在这](https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Persistence.html)提到

controller.h

```cpp
Steinberg::tresult PLUGIN_API setComponentState(Steinberg::IBStream* state) SMTG_OVERRIDE;
Steinberg::tresult PLUGIN_API setState(Steinberg::IBStream* state) SMTG_OVERRIDE;
Steinberg::tresult PLUGIN_API getState(Steinberg::IBStream* state) SMTG_OVERRIDE;
```

IBStream接口的方法

ibstream.h

```cpp
// vst3sdk
/** Reads binary data from stream.
\param buffer : destination buffer
\param numBytes : amount of bytes to be read
\param numBytesRead : result - how many bytes have been read from stream (set to 0 if this is of no interest) */
virtual tresult PLUGIN_API read (void* buffer, int32 numBytes, int32* numBytesRead = nullptr) = 0;

/** Writes binary data to stream.
\param buffer : source buffer
\param numBytes : amount of bytes to write
\param numBytesWritten : result - how many bytes have been written to stream (set to 0 if this is of no interest) */
virtual tresult PLUGIN_API write (void* buffer, int32 numBytes, int32* numBytesWritten = nullptr) = 0;

/** Sets stream read-write position. 
\param pos : new stream position (dependent on mode)
\param mode : value of enum IStreamSeekMode
\param result : new seek position (set to 0 if this is of no interest) */
virtual tresult PLUGIN_API seek (int64 pos, int32 mode, int64* result = nullptr) = 0;

/** Gets current stream read-write position. 
\param pos : is assigned the current position if function succeeds */
virtual tresult PLUGIN_API tell (int64* pos) = 0;
```

照着签名填就是了，没什么可说的

controller里面本身是没有导入ibstream.h，虽然我不知道在哪向前声明了，直接写`state->write()`编译器会报类不完整，所以先在controller.cpp里面导入头文件

保存状态

controller.cpp

```cpp
tresult PLUGIN_API YGainController::getState(IBStream* state)
{
	// Here you are asked to deliver the state of the controller (if needed)
	// Note: the real state of your plug-in is saved in the processor
	if (!state) return kResultFalse;
	IBStreamer streamer(state, kLittleEndian);
	int32_t firstPointY = static_cast<int32_t>(lfoPointManager.points().at(0).y);
	streamer.writeInt32(firstPointY);
	streamer.writeInt32(static_cast<int32_t>(lfoPointManager.points().size() - 2)); // 写入点的数量，因为LFOPointManager里面自带端点和一个控制点

	for (size_t i = 1; i < lfoPointManager.points().size() - 1; ++i)
	{
		LFOPoint<float> point = lfoPointManager.points().at(i);
		void* data = &point;
		state->write(data, sizeof(LFOPoint<float>));
	}

	streamer.writeInt32(static_cast<int32_t>(lfoPointManager.controlPoints().size()));

	for (size_t i = 0; i < lfoPointManager.controlPoints().size(); ++i)
	{
		LFOPoint<float> controlPoint = lfoPointManager.controlPoints().at(i);
		void* data = &controlPoint;
		state->write(data, sizeof(LFOPoint<float>));
	}

	state->seek(0, IBStream::kIBSeekSet, nullptr); // 重置游标

	return kResultTrue;
}
```

装载，按照写入的顺序读取就行了

controller.cpp

```cpp
tresult PLUGIN_API YGainController::setState(IBStream* state)
{
	// Here you get the state of the controller
	if (!state) return kResultFalse;

	int32_t pointCount = 0;
	int32_t firstPointY = 0;
	IBStreamer streamer(state, kLittleEndian);
	if (streamer.readInt32(firstPointY) == false) return kResultFalse;
	if (streamer.readInt32(pointCount) == false) return kResultFalse;

	lfoPointManager.moveEndPoints(firstPointY); // 移动第一个点

	for (size_t i = 0; i < pointCount; ++i)
	{
		LFOPoint<float> point;
		state->read(&point, sizeof(LFOPoint<float>));
		int pointIndex = lfoPointManager.addPoint(point);
		if (pointIndex >= 0)
		{
			if (lfoPointManager.movePoints(pointIndex, point.x, point.y)
				!= static_cast<int>(yzaudiolib::status::code261024::LFOStatus::success))
				return kResultFalse;
		}
	}

	if (streamer.readInt32(pointCount) == false) return kResultFalse;

	for (size_t i = 0; i < pointCount; ++i)
	{
		LFOPoint<float> controlPoint;
		state->read(&controlPoint, sizeof(LFOPoint<float>));
		if (lfoPointManager.moveControlPoints(i, controlPoint.x, controlPoint.y)
			!= static_cast<int>(yzaudiolib::status::code261024::LFOStatus::success))
			return kResultFalse;
	}

	sendPointsMessage();
	sendControlPointsMessage();

	state->seek(0, IBStream::kIBSeekSet, nullptr); // 重置游标

	return kResultTrue;
}
```

我为什么不直接把vector拷贝然后写入呢？因为如果我要这样做LFOPointManager需要新增接口，而这个接口需要直接把点拷贝到LFOPointManager中，但是LFOPointManager是一个容器which不允许任何外部直接修改，而间接修改已经有了`movePoints`。以LFO的点数上来说这点性能影响微乎其微，如果性能影响太大，那就给LFOPointManager增加内存预分配接口

然后我用ableton live测试的时候竟然崩了，调用堆栈显示在LFOView的构造函数里尝试读取lfoPointManager，出现了0xFFFFFFFFFFFFFFFF。按理来说controller的生命周期确实比view要长，怎么会出现这个问题呢？然后我在fl studio里测试，fl studio这里没崩。经过我的排查，ableton live关闭插件后，controller的terminate会被调用，LFOPointManager理所当然地就被销毁了。所以之前我直接在initialize方法里用static声明的LFOViewCreator就持有了一个悬空指针（我很疑惑我为什么会这样做），里面的view自然都是持有悬空指针。fl studio我不清楚它为什么没崩

所以用智能指针把LFOViewCreator声明为controller的成员

controller.h

```cpp
std::unique_ptr<VSTGUI::LFOViewCreator> lfoViewCreator;
```

这样每次创建都会重新创建一个拥有正常LFOPointManager指针的LFOViewCreator，CView重新创建之后就能正常获取到LFOPointManager的指针

然后再一次进行测试，结果又崩了，不过这次崩的地方不同。因为这次重新创建了Creator，UIViewFactory会调用之前注册的指针，这样就调用到被销毁的Creator了，tnnd早知道抄CXYPad的时候多留意一下

增加移除注册的方法

LFOViewCreator.h

```cpp
~LFOViewCreator()
{
	if (registered)
	{
		UIViewFactory::unregisterViewCreator(*this);
	}
}
```

好的，现在的工作已经完成大半

### 改变注入方式

问题还有，我在宿主中测试开多个插件发现，它们似乎共用同一个LFOPointManager。processor和controller是唯一的，但是控制台显示`ViewCreateFunction for 'LFOView' already registered`，打开两个插件时创建的第二个creator实例的`create`方法就不会被调用，然后调用第一个实例的`create`，里面还有第一个实例的EditController和LFOPointManager的引用，所以创建出来的实例就和第一个一模一样，修改的也是第一个实例的数据

唉，这个也不好解决，vstgui的架构真的是...vstgui的UIViewFactory阻止在中间我怎么初始化cview组件里的参数，用`verifyView`这个方法又得自己手动管理生命周期，这种设计结构好离谱，但是没办法，来深入看看代码吧，让我们使用奇技淫巧！

既然现在ViewCreator已经被注册了，就不用管插件打开时用的哪个ViewCreator。关键是`create`这个方法，打开第二个插件实例时用的仍然是第一个的`create`方法，所以来看看它。在uiviewfactory.h里，`createViewByName`这个方法被写在protected里面，没办法继承重写，不过IViewFactory声明了一个带有virtual关键字的`createView`方法，意味着我们能重写这个方法，既然`createViewByName`写在protected里面，那这应该是唯一的入口点了

uiviewfactory.cpp

```cpp
// vst3sdk
CView* UIViewFactory::createViewByName (const std::string* className, const UIAttributes& attributes, const IUIDescription* description) const
{
	auto& registry = getCreatorRegistry ();
	auto iter = registry.find (className->c_str ());
	if (iter != registry.end ())
	{
		CView* view = (*iter).second->create (attributes, description); //creator里面覆写的create在这调用
		if (view)
		{
			IdStringPtr viewName = (*iter).second->getViewName ();
			view->setAttribute (kViewNameAttribute, viewName);
			UIAttributes evaluatedAttributes;
			evaluateAttributesAndRemember (view, attributes, evaluatedAttributes, description);
			while (iter != registry.end () && (*iter).second->apply (view, evaluatedAttributes, description))
			{
				if ((*iter).second->getBaseViewName () == nullptr)
					break;
				iter = registry.find ((*iter).second->getBaseViewName ());
			}
			return view;
		}
	}
	else
	{
	#if DEBUG
		DebugPrint ("UIViewFactory::createView(..): Could not find view of class: %s\n", className->c_str ());
	#endif
	}
	return nullptr;
}

CView* UIViewFactory::createView (const UIAttributes& attributes, const IUIDescription* description) const
{
	const std::string* className = attributes.getAttributeValue (UIViewCreator::kAttrClass);
	if (className)
		return createViewByName (className, attributes, description);
	std::string viewContainerName ("CViewContainer");
	return createViewByName (&viewContainerName, attributes, description);
}
```

`createViewByName`的签名已经固定，意味着不能直接注入，与理想状态有点差距。但是现在至少能获取CView指针了。现在有必要先将ViewCreator里面的各种注入成员清理，因为第二个插件实例用的是第一个插件的引用，删掉第一个插件第二个的引用就悬空了，这正是这种架构的坑爹之处啊

没有注入后，就需要写`set()`让CView子类获取指针，然后又得到处写判断nullptr以保证内存安全☹️，感觉这样的实现有悖于我的编程原则

不过我还有办法，因为`createViewByName`返回了创建的CView实例，那我就让这个实例无外部依赖，里面专门写一个方法用于创建真正需要的CView实例并且注入依赖，我觉得这个可以，这正是CViewContainer的工作

然后就写了一个CViewContainer

LFOViewContainer.cpp

```cpp
#pragma once

#include "LFOViewContainer.h"
#include "LFOView.h"

#include "yzaudiolib/tools/lfo/LFOPointManager.h"
#include "public.sdk/source/vst/vsteditcontroller.h"

namespace VSTGUI
{
	LFOViewContainer::LFOViewContainer(const CRect& size)
		: CViewContainer(size)
	{
	}

	void LFOViewContainer::createView(const CRect& size, Steinberg::Vst::EditController& editController, LFOPointManager<float>& pointManager)
	{
		auto lfoView = new LFOView(size, editController, pointManager);
		addView(lfoView, size, true);
	}
}
```

继承UIViewFactory重写`createView`方法

LFOViewCreator.h

```cpp
class MyUIViewFactory : public UIViewFactory
{
	CView* createView(const UIAttributes& attributes, const IUIDescription* description) const override
	{
		return UIViewFactory::createView(attributes, description);
	}
};
```

我靠我写到这里才发现UIViewFactory好像不能获取controller的指针。又得重新写了

不过还是有方法的，[这里](https://forums.steinberg.net/t/how-to-uniquely-identify-a-view-in-verifyview/1012156/2)有说明

所以在controller里面重写VST3EditorDelegate类的`verifyView()`吧

controller.h

```cpp
VSTGUI::CView* verifyView(VSTGUI::CView* view, const VSTGUI::UIAttributes& attributes,
	const VSTGUI::IUIDescription* description, VSTGUI::VST3Editor* editor) override;
```

进行一个入的注

controller.cpp

```cpp
VSTGUI::CView* YGainController::verifyView(VSTGUI::CView* view, const VSTGUI::UIAttributes& attributes,
	const VSTGUI::IUIDescription* description, VSTGUI::VST3Editor* editor)
{
	VSTGUI::LFOViewContainer* lfoViewContainer = dynamic_cast<VSTGUI::LFOViewContainer*>(view);
	if (lfoViewContainer == nullptr) return view;
	lfoViewContainer->createView(width, height, *this, lfoPointManager);
	return view;
}
```
`createView`的方法签名本来是`createView(const CRect& size, Steinberg::Vst::EditController& editController, LFOPointManager<float>& pointManager)`这样的，但是verifyView阶段无论是调用`lfoViewContainer->getViewSize()`还是直接在`createView`里面调用`getViewSize()`都会崩溃，可能verifyView阶段View并没有创建完成。所以这里CRect改成了两个参数width和height，在createView里面直接构造一个CRect

最后一步是初始化时在controller发送点到音频线程中，虽然LFOView初始化会`sentMessage()`，但是ui没打开的时候音频线程是没有接收到点的，所以controller还要再发一次

`sendMessage()`的代码就不贴出来了，我在`setState`这个方法里调用

到这步，所有工作算是完成了