---
outputDir: /音频/vst3
parentPath: /音频/vst3.html
---

LFO的绘制比较困难

我的想法是比如说我要做一个lfo，一开始lfo有端点和中间一个用于改变曲线的点（贝塞尔曲线）。然后双击生成一个点，在点的两端创建两个组件，一样包含端点和中间一个点，如此往复以形成复杂的lfo曲线

点管理器需要增加点的方法，寻找端点的方法以及删除点的方法。这里我使用二分法查找。增加控制点时需要判断控制点在新增端点的左边还是右边。构造函数里初始化点，然后再加两个方法返回端点可控制点

### LFOCurveView

LFOCurveView这边需要遍历点。在draw方法里面，外层一层for循环通过读取size()，遍历所有的点。这里很显然控制点始终比端点少一个，所以可以用控制点前面的端点的索引代替控制点的索引

LFOCurveView.cpp

```cpp
// ...
CGraphicsPath* path = context->createGraphicsPath();

const double step = 2.0; //步长
bool first = true;

for (size_t i = 0; i < lfoPointManager.points().size() - 1; i++)
{
	for (double t = 0; t <= 1.0; t += step / w)
	{

		double x1 = yzaudiolib::math::lerp::lerp(lfoPointManager.points().at(i).x, lfoPointManager.controlPoints().at(i).x, t);
		double y1 = yzaudiolib::math::lerp::lerp(lfoPointManager.points().at(i).y, lfoPointManager.controlPoints().at(i).y, t);

		double x2 = yzaudiolib::math::lerp::lerp(lfoPointManager.controlPoints().at(i).x, lfoPointManager.points().at(i + 1).x, t);
		double y2 = yzaudiolib::math::lerp::lerp(lfoPointManager.controlPoints().at(i).y, lfoPointManager.points().at(i + 1).y, t);

		double x3 = yzaudiolib::math::lerp::lerp(x1, x2, t);
		double y3 = yzaudiolib::math::lerp::lerp(y1, y2, t);
		CPoint p(x3, y3);
		if (first)
		{
			path->beginSubpath(p);
			first = false;
		}
		else
		{
			path->addLine(p);
		}
	}
}
//...
```

### 有关CViewContainer的东西

需要注意到vstgui有一个CViewContainer，要用到它管理子组件。LFO的绘制分成两部分，一部分是点，用LFOPointView对象，需要接收鼠标的信息。一部分是曲线的绘制，用LFOCurveView对象

LFOPointManager里新增两个方法用于移动点。LFOView中继承CViewContainer，我打算把每一个点单独作为一个对象。显然，点需要知道自己在哪里，所以需要把LFOPointManager作为依赖注入到点中，同时注入索引

在LFOView声明两个成员，一个是LFOCurveView，一个是LFOPointManager

LFOView.h

```cpp
LFOCurveView* curveView;
LFOPointManager<float> lfoPointManager;
```

现在让LFOPointView和LFOCurveView变成CViewContainer的子组件，需要用到addView方法。CViewContainer的addView有两种签名`virtual bool addView (CView* pView, CView* pBefore = nullptr);`以及`bool addView (CView* pView, const CRect& mouseableArea, bool mouseEnabled = true);`，需要用到鼠标的CView子类需要使用第二个方法。还可以看到第一个是个虚函数，这是因为第二个调用的时候也会调用第一个，所以子类重写第一个方法之后，第二个方法也能调用第一个方法

cviewcontainer.cpp

:::addView
```cpp
// vst3sdk
bool CViewContainer::addView (CView* pView, const CRect &mouseableArea, bool mouseEnabled)
{
	if (addView (pView, nullptr)) // <------在这里调用
	{
		pView->setMouseEnabled (mouseEnabled);
		pView->setMouseableArea (mouseableArea);
		return true;
	}
	return false;
}
```
:::

CViewContainer会自动管理你的CView子类的生命周期，所以在使用addView传入CView的指针时，相当于所有权转移了，并且编译器不会像rust那样报错。可以直接使用new，你不应该把CView子类声明为成员变量，再然后把指针传进去。所以c++的智能指针当然也是不能用的，通过`get()`方法，这会导致重复释放，是未定义行为

在LFOView的构造函数中

LFOView.cpp

```cpp
// ...
curveView = new LFOCurveView(viewSize_, lfoPointManager, [this](int pointIndex) {return addOView(pointIndex);});
addView(curveView, size, true);
// ...
```

这里说一下绘制的问题。CViewContainer重写了CView的drawRect方法，在CView中draw方法是通过drawRect调用的。但是CViewContainer它的drawRect方法重写成了调用传入CView子类的draw方法，所以继承CViewContainer并重写draw方法是没效果的

对比CView和CViewContainer的drawRect方法

cview.h
```cpp
// vst3sdk
/** called if the view should draw itself */
virtual void drawRect (CDrawContext *pContext, const CRect& updateRect) { draw (pContext); }
```

cviewcontainer.cpp

@[drawRect](drawRect)

:::drawRect
```cpp
// vst3sdk
void CViewContainer::drawRect (CDrawContext* pContext, const CRect& updateRect)
{
	CPoint offset (getViewSize ().left, getViewSize ().top);
	CDrawContext::Transform offsetTransform (*pContext, CGraphicsTransform ().translate (offset.x, offset.y));

	CRect _updateRect (updateRect);
	_updateRect.bound (getViewSize ());

	CRect clientRect (_updateRect);
	clientRect.offset (-getViewSize ().left, -getViewSize ().top);

	CRect oldClip;
	pContext->getClipRect (oldClip);
	CRect oldClip2 (oldClip);

	CRect newClip (clientRect);
	newClip.bound (oldClip);
	pContext->setClipRect (newClip);

	// draw the background
	drawBackgroundRect (pContext, clientRect);

	CView* _focusView = nullptr;
	IFocusDrawing* _focusDrawing = nullptr;
	auto frame = getFrame ();
	if (frame && frame->focusDrawingEnabled () && isChild (frame->getFocusView (), false) && frame->getFocusView ()->isVisible () && frame->getFocusView ()->wantsFocus ())
	{
		_focusView = frame->getFocusView ();
		_focusDrawing = dynamic_cast<IFocusDrawing*> (_focusView);
	}

	{
		CDrawContext::Transform tr (*pContext, getTransform ());
		getTransform ().inverse ().transform (newClip);
		getTransform ().inverse ().transform (clientRect);
		getTransform ().transform (oldClip2);

		// draw each view
		for (const auto& pV : pImpl->children)
		{
			if (pV->isVisible ())
			{
				if (frame && _focusDrawing && _focusView == pV && !_focusDrawing->drawFocusOnTop ())
				{
					SharedPointer<CGraphicsPath> focusPath = owned (pContext->createGraphicsPath ());
					if (focusPath)
					{
						if (_focusDrawing->getFocusPath (*focusPath))
						{
							auto lastDrawnFocus = focusPath->getBoundingBox ();
							if (!lastDrawnFocus.isEmpty ())
							{
								pContext->setClipRect (oldClip2);
								pContext->setDrawMode (kAntiAliasing|kNonIntegralMode);
								pContext->setFillColor (frame->getFocusColor ());
								pContext->drawGraphicsPath (focusPath, CDrawContext::kPathFilledEvenOdd);
								lastDrawnFocus.extend (1, 1);
								setLastDrawnFocus (lastDrawnFocus);
							}
							_focusDrawing = nullptr;
							_focusView = nullptr;
						}
					}
				}

				if (checkUpdateRect (pV, clientRect))
				{
					CRect viewSize = pV->getViewSize ();
					viewSize.bound (newClip);
					if (viewSize.getWidth () == 0 || viewSize.getHeight () == 0)
						continue;
					pContext->setClipRect (viewSize);
					float globalContextAlpha = pContext->getGlobalAlpha ();
					pContext->setGlobalAlpha (globalContextAlpha * pV->getAlphaValue ());
					pV->drawRect (pContext, viewSize);
					pContext->setGlobalAlpha (globalContextAlpha);
#if DEBUG
					static bool drawViewWireFrames = false;
					if (drawViewWireFrames)
					{
						pContext->setFrameColor (kRedCColor);
						pContext->setLineWidth (pContext->getHairlineSize ());
						pContext->setLineStyle (kLineSolid);
						pContext->drawRect (pV->getViewSize ());
					}
#endif
				}
			}
		}
	}

	pContext->setClipRect (oldClip2);

	if (frame && _focusView)
	{
		SharedPointer<CGraphicsPath> focusPath = owned (pContext->createGraphicsPath ());
		if (focusPath)
		{
			if (_focusDrawing)
				_focusDrawing->getFocusPath (*focusPath);
			else
			{
				CCoord focusWidth = frame->getFocusWidth ();
				CRect r (_focusView->getVisibleViewSize ());
				if (!r.isEmpty ())
				{
					focusPath->addRect (r);
					r.extend (focusWidth, focusWidth);
					focusPath->addRect (r);
				}
			}
			auto lastDrawnFocus = focusPath->getBoundingBox ();
			if (!lastDrawnFocus.isEmpty ())
			{
				pContext->setDrawMode (kAntiAliasing|kNonIntegralMode);
				pContext->setFillColor (frame->getFocusColor ());
				pContext->drawGraphicsPath (focusPath, CDrawContext::kPathFilledEvenOdd);
				lastDrawnFocus.extend (1, 1);
				setLastDrawnFocus (lastDrawnFocus);
			}
		}
	}

	setDirty (false);
}
```
:::

可以看到cviewcontainer.cpp不会调用自身的draw方法。因此我们并不能复制在CView里的操作：覆写draw方法画东西。不过仍有方法在CViewContainer用子类画东西，利用多态，覆写CViewContainer的drawRect方法，然后在子类覆写的方法里调用父类的方法就可以了

### 鼠标事件

然后就是addView了，把指针都传进去。lfoPointView要使用带有mouseableArea参数的那个方法，这里需要观察这个方法的实现。在CViewContainer中找到@[实现方法](addView)，可以看到指针传入后首先调用了第一个addView方法，第二个参数传入nullptr，然后里面调用了传入CView子类的setMouseEnabled和setMouseableArea方法。再来看看@[setMouseableArea](setMouseableArea)的实现，这段代码很显然就是检查是否是同一个矩形，相同就去掉这个鼠标事件的区域，使用整个view接收鼠标事件，不同就直接设置区域。改变区域时应该是不用手动去掉旧区域的

:::setMouseableArea

<p>cview.cpp</p>

```cpp
// vst3sdk
void CView::setMouseableArea (const CRect& rect)
{
	if (pImpl->size == rect)
	{
		setViewFlag (kHasMouseableArea, false);
		removeAttribute (kCViewMouseableAreaAttrID);
	}
	else
	{
		setViewFlag (kHasMouseableArea, true);
		setAttribute (kCViewMouseableAreaAttrID, rect);
	}
}
```
:::

再说一下鼠标事件顺序的问题，第一个addView方法，也就是`CView *pView, CView* pBefore`这个签名的，@[打开CViewContainer里的实现](addView_2)，在这里面pBefore接收到的其实是前一个CView的指针，还可以发现里面是使用list管理你传入的CView子类，你可以指定pBefore，它就会找到pBefore的位置并insert到其中，需要知道事件的顺序与addView调用的顺序有关。再提一下如果覆写CViewContainer的onMouseDownEvent事件，这个事件的优先级会在通过addView传入的所有CView子类的上方

:::addView_2

<p>cviewcontainer.cpp</p>

```cpp
//vst3sdk
bool CViewContainer::addView (CView *pView, CView* pBefore)
{
	if (!pView)
		return false;

	vstgui_assert (!pView->isSubview (), "view is already added to a container view");

	if (pBefore)
	{
		auto it = std::find (pImpl->children.begin (), pImpl->children.end (), pBefore);
		vstgui_assert (it != pImpl->children.end ());
		pImpl->children.insert (it, pView);
	}
	else
	{
		pImpl->children.emplace_back (pView);
	}

	pView->setSubviewState (true);

	pImpl->viewContainerListeners.forEach ([&] (IViewContainerListener* listener) {
		listener->viewContainerViewAdded (this, pView);
	});

	if (isAttached ())
	{
		pView->attached (this);
		pView->invalid ();
	}
	return true;
}
```

:::

LFOPointView继承的是CParamDisplay和CMouseWheelEditingSupport，为什么继承这两个，因为我抄的cxypad。这个类要实现的东西和我现在要实现的东西比较接近，CParamDisplay是CControl的子类，里面的isDirty方法会判断值是否是之前的值，只有当值改变时才会return true。里面有一个setValue的方法，会改变value并且限制在最大值和最小值间，或者直接改value也可以

ccontrol.cpp

```cpp
// vst3sdk
bool CControl::isDirty () const
{
	if (getOldValue () != value || CView::isDirty ())
		return true;
	return false;
}
```

cxypad里面有很多的鼠标事件，让我们进行一般的抄袭。还要注意里面有`event.consumed = true;`，没有这个是不会调用onMouseUpEvent和onMouseMoveEvent等其它函数的。里面有一些东西是我们不需要的，比如`getRoundRectRadius()`，`offset()`这种方法

cxypad.cpp

```cpp
// vst3sdk
void CXYPad::onMouseDownEvent (MouseDownEvent& event)
{
	if (event.buttonState.isLeft ())
	{
		invalidMouseWheelEditTimer (this);
		mouseStartValue = getValue ();
		mouseChangeStartPoint = event.mousePosition;
		mouseChangeStartPoint.offset (-getViewSize ().left - getRoundRectRadius () / 2.,
		                              -getViewSize ().top - getRoundRectRadius () / 2.);
		beginEdit ();
		onMouseMove (event); // event.consumed = true;在这个方法里面
	}
}
```

在new LFOPointView的时候，需要传入一个CRect，传入的是LFOView的size，不是LFOPointView绘制的大小和位置。这时候通过`auto where = event.mousePosition;`获取的坐标原点就是CRect的左上角。这点和juce框架是一样的

LFOView.cpp

```cpp
auto* point = new LFOPointView(CRect(0, 0, viewSize_.right, viewSize_.bottom), lastIndex, pointRadius, lfoPointManager);
```

画点的位置在`CRect r(x - pointRadius, y - pointRadius, x + pointRadius, y + pointRadius);`，调用`setMouseableArea(CRect(where.x - pointRadius, where.y - pointRadius, where.x + pointRadius, where.y + pointRadius));`，设置鼠标事件区域，pointRadius是一个常量，字面意思就是点半径。这个不能直接用鼠标位置的值，因为鼠标的坐标容易飞出组件外，用LFOPointManager已经判断好边界的值

LFOPointView.cpp

```cpp
void LFOPointView::onMouseMoveEvent(MouseMoveEvent& event)
{
	if (event.buttonState.isLeft() && isEditing())
	{
		auto where = event.mousePosition;
		if (stopTrackingOnMouseExit)
		{
			if (!hitTest(where, event))
			{
				endEdit();
				event.ignoreFollowUpMoveAndUpEvents(true);
				event.consumed = true;
				return;
			}
		}

		lfoPointManager.movePoints(pointIndex, where.x, where.y);
		auto x = lfoPointManager.points().at(pointIndex).x;
		auto y = lfoPointManager.points().at(pointIndex).y;
		value = calculateValue(x, y);
		if (isDirty())
		{
			valueChanged();
			invalid();
		}
		event.consumed = true;
	}
}
```

比如在这里直接setMouseableArea，直接传入where.x和where.y的值。我的setMouseableArea写到了draw方法里，虽然语义不正确，但是先这样用着

我学习cxypad用calculateValue和calculateXY这两个函数来保存值，但是calculateXY这个用不用都无所谓了，前面说到value的值改变了isDirty()才是true，所以用`value = calculateValue(x, y);`这一行改变值

cxypad.h

```cpp
// vst3sdk
static float calculateValue (float x, float y)
{
	x = std::floor (x * 1000.f + 0.5f) * 0.001f;
	y = std::floor (y * 1000.f + 0.5f) * 0.0000001f;
	return x + y;
}
```

这段代码我看不懂

然后再写一个LFOControlPointView，但是比较简单，都是复制粘贴罢了

下一步就是要做新增点，这一步在画曲线那里做吧，因为曲线的mouseableArea正好是组件的大小，而且addView在点的前面。检测双击的函数需要自己写，让ai写一小段简单的检测方法就行了

DetectDoubleClick.h

```cpp
#include <chrono>

namespace yzaudiolib::tools::DetectDoubleClick
{
    inline int detectDoubleClick(int interval = 500)
    {
        using namespace std::chrono;

        static steady_clock::time_point lastClickTime;
        static bool hasLastClick = false;

        auto now = steady_clock::now();

        if (hasLastClick)
        {
            auto elapsed = duration_cast<milliseconds>(now - lastClickTime).count();
            if (elapsed <= interval)
            {
                hasLastClick = false;
                return 1;
            }
        }

        lastClickTime = now;
        hasLastClick = true;
        return 0;
    }
}
```

### 新增点

新增点需要执行addView等操作，不过不能直接给LFOCurveView注入LFOView，因为这会导致互相include无法通过编译，而且这样也会增加耦合。假设LFOCurveView对回调的函数一无所知，只有一个pointIndex，那就不能向前声明或者include，它应该只是一味地进行调用，然后传入pointIndex，至于怎么使用pointIndex那是外界的事，这就划分清楚职责关系了，把具体怎么做移交到外部，不需要自己考虑。所以为了能让addView正常调用同时不违背依赖倒置原则，这里会使用函数指针。但是按照这个理论，我前面做的一些东西其实都不太好，这些工作到重构在做。这里注入函数指针，把函数指针作为LFOCurveView的依赖，用的是std::function，这个是有类型擦除性能开销的，不过在ui回调这里可以接受。具体重构在这里

LFOPointView.h

```cpp
// ...
public:
	using Callback = std::function<int(int)>;
    int setCallback(Callback cbf);
	int callBack(int pointIndex) const;
// ...

private:
    Callback cb = nullptr;
// ...

```

LFOPointView.cpp

```cpp
void LFOPointView::onMouseDownEvent(MouseDownEvent& event)
{
	if (event.buttonState.isLeft())
	{
        // ...
		callBack(pointIndex);
		return;
	}
}

int LFOPointView::setCallback(Callback cbf)
{
	this->cb = cbf;
	return 0;
}

int LFOPointView::callBack(int pointIndex) const
{
	if (cb == nullptr) return 0;
	return cb(pointIndex);
}
```

addView完成后，现在有一个问题，点的绘制如何刷新？现在的问题是每一个点对象存有自己的pointIndex，addView后需要全部改变吗？实际上可以发现，addView后即使不改变每一个点对象的pointIndex，它们都有对应点的位置。新增的点位置在哪里，我们并不关心，因为刷新时它们都已经有对应的点了，只是多出来最后一个点。所以我需要想想点这个对象在刷新时需要改变那些状态，第一个就是mouseableArea，这个要在刷新的时候重新设置，由于addView后会进行重绘，需要把mouseableArea放draw里面，这就是为什么我要把一个语义毫不相关的mouseableArea放draw里面。然后就似乎没有东西可以改了。对于controlPoint也一样

举例一下：比如说LFOPointManager里面有0，1，2，3这几个点，现在LFOPointView都有对应的实例来绘制它们，索引分别为0，1，2，3。现在新增一个点在1，2之间变成0，1，2，3，4。现在是不是前四个点仍然有对应的实例绘制，所以只需要新增最后面一个实例就足够了

LFOView.cpp
:::addOView
```cpp
int LFOView::addOView(int pointIndex)
{
	auto lastIndex = lfoPointManager.points().size() - 2;
	CRect r(lfoPointManager.points().at(lastIndex).x - pointRadius
		, lfoPointManager.points().at(lastIndex).y - pointRadius
		, lfoPointManager.points().at(lastIndex).x + pointRadius
		, lfoPointManager.points().at(lastIndex).y + pointRadius);
	auto* point = new LFOPointView(CRect(0, 0, viewSize_.right, viewSize_.bottom), lastIndex, pointRadius, lfoPointManager);
	point->setCallback([this](int pointIndex) {return deleteControlPoint(pointIndex);});
	addView(point, r, true);
	addView(new LFOControlPointView(CRect(0, 0, viewSize_.right, viewSize_.bottom), lastIndex, controlPointRadius, lfoPointManager), r, true);
	return 0;
	}
```
:::

然后通过setCallback方法把函数给LFOCurvePoint回调
`curveView = new LFOCurveView(viewSize_, lfoPointManager, [this](int pointIndex) {return addOView(pointIndex);});`

### 删除点

用鼠标右键删除point，在onMouseMoveEvent判断鼠标右键。与添加点一样，需要删除最后一个点的实例，这里用到`bool CViewContainer::removeView (CView *pView, bool withForget)`，后面这个@[forget](removeView)就是减少引用计数的，因为它是`std::list<SharedPointer<CView>>`这样管理CView的嘛。同样，LFOPointView也要实现一个回调，但是这里需要向外传自身的指针？好吧其实并不需要，因为也还是删除最后一个，直接用`CView* CViewContainer::getView (uint32_t index) const`拿指针就行

:::removeView

<p>cviewcontainer.cpp</p>

```cpp
// vst3sdk
bool CViewContainer::removeView (CView *pView, bool withForget)
{
	auto it = std::find (pImpl->children.begin (), pImpl->children.end (), pView);
	if (it != pImpl->children.end ())
	{
		if (pView == getInitialFocusView ())
			setInitialFocusView (nullptr);
		pView->invalid ();
		if (pView == getMouseDownView ())
			clearMouseDownView ();
		if (isAttached ())
			pView->removed (this);
		pView->setSubviewState (false);
		pImpl->viewContainerListeners.forEach ([&] (IViewContainerListener* listener) {
			listener->viewContainerViewRemoved (this, pView);
		});
		if (withForget)
			pView->forget ();
		pImpl->children.erase (it);
		return true;
	}
	return false;
}
```

:::

现在有一个问题，右键调用的是vstplugintesthost的菜单，并没有回调我们所需的方法。经过我的查找，找到了这个[Right button mouse click is not always available](https://forums.steinberg.net/t/right-button-mouse-click-is-not-always-available/909372)这里说宿主可能实现了IContextMenu，然后right click不生效，所以这里图方便用鼠标左键+kAlt删除点

```cpp
void LFOPointView::onMouseDownEvent(MouseDownEvent& event)
{
	if (event.buttonState.isLeft())
	{
		invalidMouseWheelEditTimer(this);
		beginEdit();
		event.consumed = true;
	if (yzaudiolib::tools::detectDoubleClick::detectDoubleClick(150))
	{
		event.consumed = false;
		callBack(pointIndex);
		return;
	}
		if (!event.modifiers.has(ModifierKey::Alt)) return;
		event.consumed = false;
		callBack(pointIndex);
		return;
	}
}
```

我花了半天的时间去想怎么把LFOPointView销毁自身，比如仿照前面回调，在LFOView这里删除自身。不过在销毁后有一个问题，在LFOView这里回调调用removeView后，此时LFOPointView的mouse的调用栈没有退出，包括使用`VSTGUI::SharedPointer<VSTGUI::CView> keepAlive(this);`尝试增加引用计数，都会报错

>引发了异常: 读取访问权限冲突。
>pV.ptr 是 0xFFFFFFFFFFFFFFFF。

然后我才想到我根本不需要销毁LFOPointView，因为我只需要在draw()那里加上判断就可以防止LFOPointView用越界的索引去读取vector了，这样既不会重绘也可以清除鼠标区域。这时职责划分的优势就体现出来了，LFOPointView只需要关注自身，虽然我之前没想到

其实不删除也是不行的，因为上面那个@[addOView](addOView)始终在创建实例，还是需要考虑销毁对象的。比如使用类似于垃圾回收的方式，给每个LFOPointView贴上标签，删除点时回调检查末尾有没有多余的对象，然后删除

最终代码的呈现可能与这里列举的代码有所不同，因为这是我写代码时写的。我尽可能多的记录有关vst3框架的东西

<span title="我只是在偷偷讲些c++小知识罢了😋">-</span>