import {
  BBox,
  boolLerp,
  Direction,
  InterpolationFunction,
  modify,
  Origin,
  originToOffset,
  PossibleSpacing,
  PossibleVector2,
  SerializedVector2,
  Signal,
  SignalValue,
  SimpleSignal,
  SimpleVector2Signal,
  SpacingSignal,
  threadable,
  ThreadGenerator,
  TimingFunction,
  tween,
  Vector2,
  Vector2Signal,
} from '@motion-canvas/core';
import Yoga, {PositionType, Node as YogaNode} from 'yoga-layout';
import {
  addInitializer,
  cloneable,
  computed,
  defaultStyle,
  getPropertyMeta,
  initial,
  interpolation,
  nodeName,
  signal,
  Vector2LengthSignal,
  vector2Signal,
} from '../decorators';
import {spacingSignal} from '../decorators/spacingSignal';
import {
  DesiredLength,
  FlexBasis,
  FlexContent,
  FlexDirection,
  FlexItems,
  FlexWrap,
  LayoutMode,
  Length,
  LengthLimit,
  TextWrap,
} from '../partials';
import {drawLine, drawPivot, is} from '../utils';
import {Node, NodeProps} from './Node';

export interface LayoutProps extends NodeProps {
  layout?: LayoutMode;
  tagName?: keyof HTMLElementTagNameMap;

  width?: SignalValue<Length>;
  height?: SignalValue<Length>;
  maxWidth?: SignalValue<LengthLimit>;
  maxHeight?: SignalValue<LengthLimit>;
  minWidth?: SignalValue<LengthLimit>;
  minHeight?: SignalValue<LengthLimit>;
  ratio?: SignalValue<number>;

  marginTop?: SignalValue<number>;
  marginBottom?: SignalValue<number>;
  marginLeft?: SignalValue<number>;
  marginRight?: SignalValue<number>;
  margin?: SignalValue<PossibleSpacing>;

  paddingTop?: SignalValue<number>;
  paddingBottom?: SignalValue<number>;
  paddingLeft?: SignalValue<number>;
  paddingRight?: SignalValue<number>;
  padding?: SignalValue<PossibleSpacing>;

  direction?: SignalValue<FlexDirection>;
  basis?: SignalValue<FlexBasis>;
  grow?: SignalValue<number>;
  shrink?: SignalValue<number>;
  wrap?: SignalValue<FlexWrap>;

  justifyContent?: SignalValue<FlexContent>;
  alignContent?: SignalValue<FlexContent>;
  alignItems?: SignalValue<FlexItems>;
  alignSelf?: SignalValue<FlexItems>;
  rowGap?: SignalValue<Length>;
  columnGap?: SignalValue<Length>;
  gap?: SignalValue<Length>;

  fontFamily?: SignalValue<string>;
  fontSize?: SignalValue<number>;
  fontStyle?: SignalValue<string>;
  fontWeight?: SignalValue<number>;
  lineHeight?: SignalValue<Length>;
  letterSpacing?: SignalValue<number>;
  textWrap?: SignalValue<TextWrap>;
  textDirection?: SignalValue<CanvasDirection>;
  textAlign?: SignalValue<CanvasTextAlign>;

  size?: SignalValue<PossibleVector2<Length>>;
  offsetX?: SignalValue<number>;
  offsetY?: SignalValue<number>;
  offset?: SignalValue<PossibleVector2>;
  /**
   * The position of the center of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the center ends
   * up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   * When {@link offset} is not set, this will be the same as the
   * {@link NodeProps.position}.
   */
  middle?: SignalValue<PossibleVector2>;
  /**
   * The position of the top edge of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the top edge
   * ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  top?: SignalValue<PossibleVector2>;
  /**
   * The position of the bottom edge of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the bottom edge
   * ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  bottom?: SignalValue<PossibleVector2>;
  /**
   * The position of the left edge of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the left edge
   * ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  left?: SignalValue<PossibleVector2>;
  /**
   * The position of the right edge of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the right edge
   * ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  right?: SignalValue<PossibleVector2>;
  /**
   * The position of the top left corner of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the top left
   * corner ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  topLeft?: SignalValue<PossibleVector2>;
  /**
   * The position of the top right corner of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the top right
   * corner ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  topRight?: SignalValue<PossibleVector2>;
  /**
   * The position of the bottom left corner of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the bottom left
   * corner ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  bottomLeft?: SignalValue<PossibleVector2>;
  /**
   * The position of the bottom right corner of this node.
   *
   * @remarks
   * This shortcut property will set the node's position so that the bottom
   * right corner ends up in the given place.
   * If present, overrides the {@link NodeProps.position} property.
   */
  bottomRight?: SignalValue<PossibleVector2>;
  clip?: SignalValue<boolean>;
}

@nodeName('Layout')
export class Layout extends Node {
  @initial(null)
  @interpolation(boolLerp)
  @signal()
  public declare readonly layout: SimpleSignal<LayoutMode, this>;

  @initial(null)
  @signal()
  public declare readonly maxWidth: SimpleSignal<LengthLimit, this>;
  @initial(null)
  @signal()
  public declare readonly maxHeight: SimpleSignal<LengthLimit, this>;
  @initial(null)
  @signal()
  public declare readonly minWidth: SimpleSignal<LengthLimit, this>;
  @initial(null)
  @signal()
  public declare readonly minHeight: SimpleSignal<LengthLimit, this>;
  @initial(null)
  @signal()
  public declare readonly ratio: SimpleSignal<number | null, this>;

  @spacingSignal('margin')
  public declare readonly margin: SpacingSignal<this>;

  @spacingSignal('padding')
  public declare readonly padding: SpacingSignal<this>;

  @initial('row')
  @signal()
  public declare readonly direction: SimpleSignal<FlexDirection, this>;
  @initial(null)
  @signal()
  public declare readonly basis: SimpleSignal<FlexBasis, this>;
  @initial(0)
  @signal()
  public declare readonly grow: SimpleSignal<number, this>;
  @initial(1)
  @signal()
  public declare readonly shrink: SimpleSignal<number, this>;
  @initial('nowrap')
  @signal()
  public declare readonly wrap: SimpleSignal<FlexWrap, this>;

  @initial('start')
  @signal()
  public declare readonly justifyContent: SimpleSignal<FlexContent, this>;
  @initial('normal')
  @signal()
  public declare readonly alignContent: SimpleSignal<FlexContent, this>;
  @initial('stretch')
  @signal()
  public declare readonly alignItems: SimpleSignal<FlexItems, this>;
  @initial('auto')
  @signal()
  public declare readonly alignSelf: SimpleSignal<FlexItems, this>;
  @initial(0)
  @vector2Signal({x: 'columnGap', y: 'rowGap'})
  public declare readonly gap: Vector2LengthSignal<this>;
  public get columnGap(): Signal<Length, number, this> {
    return this.gap.x;
  }
  public get rowGap(): Signal<Length, number, this> {
    return this.gap.y;
  }

  @defaultStyle('font-family')
  @signal()
  public declare readonly fontFamily: SimpleSignal<string, this>;
  @defaultStyle('font-size', parseFloat)
  @signal()
  public declare readonly fontSize: SimpleSignal<number, this>;
  @defaultStyle('font-style')
  @signal()
  public declare readonly fontStyle: SimpleSignal<string, this>;
  @defaultStyle('font-weight', parseInt)
  @signal()
  public declare readonly fontWeight: SimpleSignal<number, this>;
  @defaultStyle('line-height', parseFloat)
  @signal()
  public declare readonly lineHeight: SimpleSignal<Length, this>;
  @defaultStyle('letter-spacing', i => (i === 'normal' ? 0 : parseFloat(i)))
  @signal()
  public declare readonly letterSpacing: SimpleSignal<number, this>;

  @defaultStyle('white-space', i => (i === 'pre' ? 'pre' : i === 'normal'))
  @signal()
  public declare readonly textWrap: SimpleSignal<TextWrap, this>;
  @initial('inherit')
  @signal()
  public declare readonly textDirection: SimpleSignal<CanvasDirection, this>;
  @defaultStyle('text-align')
  @signal()
  public declare readonly textAlign: SimpleSignal<CanvasTextAlign, this>;

  protected getX(): number {
    if (this.isLayoutRoot()) {
      return this.x.context.getter();
    }

    return this.computedPosition().x;
  }
  protected setX(value: SignalValue<number>) {
    this.x.context.setter(value);
  }

  protected getY(): number {
    if (this.isLayoutRoot()) {
      return this.y.context.getter();
    }

    return this.computedPosition().y;
  }
  protected setY(value: SignalValue<number>) {
    this.y.context.setter(value);
  }

  /**
   * Represents the size of this node.
   *
   * @remarks
   * A size is a two-dimensional vector, where `x` represents the `width`, and `y`
   * represents the `height`.
   *
   * The value of both x and y is of type {@link partials.Length} which is
   * either:
   * - `number` - the desired length in pixels
   * - `${number}%` - a string with the desired length in percents, for example
   *                  `'50%'`
   * - `null` - an automatic length
   *
   * When retrieving the size, all units are converted to pixels, using the
   * current state of the layout. For example, retrieving the width set to
   * `'50%'`, while the parent has a width of `200px` will result in the number
   * `100` being returned.
   *
   * When the node is not part of the layout, setting its size using percents
   * refers to the size of the entire scene.
   *
   * @example
   * Initializing the size:
   * ```tsx
   * // with a possible vector:
   * <Node size={['50%', 200]} />
   * // with individual components:
   * <Node width={'50%'} height={200} />
   * ```
   *
   * Accessing the size:
   * ```tsx
   * // retrieving the vector:
   * const size = node.size();
   * // retrieving an individual component:
   * const width = node.size.x();
   * ```
   *
   * Setting the size:
   * ```tsx
   * // with a possible vector:
   * node.size(['50%', 200]);
   * node.size(() => ['50%', 200]);
   * // with individual components:
   * node.size.x('50%');
   * node.size.x(() => '50%');
   * ```
   */
  @initial({x: null, y: null})
  @vector2Signal({x: 'width', y: 'height'})
  public declare readonly size: Vector2LengthSignal<this>;
  public get width(): Signal<Length, number, this> {
    return this.size.x;
  }
  public get height(): Signal<Length, number, this> {
    return this.size.y;
  }

  protected getWidth(): number {
    return this.computedSize().width;
  }
  protected setWidth(value: SignalValue<Length>) {
    this.width.context.setter(value);
  }

  @threadable()
  protected *tweenWidth(
    value: SignalValue<Length>,
    time: number,
    timingFunction: TimingFunction,
    interpolationFunction: InterpolationFunction<Length>,
  ): ThreadGenerator {
    const width = this.desiredSize().x;
    const lock = typeof width !== 'number' || typeof value !== 'number';
    let from: number;
    if (lock) {
      from = this.size.x();
    } else {
      from = width;
    }

    let to: number;
    if (lock) {
      this.size.x(value);
      to = this.size.x();
    } else {
      to = value;
    }

    this.size.x(from);
    lock && this.lockSize();
    yield* tween(time, value =>
      this.size.x(interpolationFunction(from, to, timingFunction(value))),
    );
    this.size.x(value);
    lock && this.releaseSize();
  }

  protected getHeight(): number {
    return this.computedSize().height;
  }
  protected setHeight(value: SignalValue<Length>) {
    this.height.context.setter(value);
  }

  @threadable()
  protected *tweenHeight(
    value: SignalValue<Length>,
    time: number,
    timingFunction: TimingFunction,
    interpolationFunction: InterpolationFunction<Length>,
  ): ThreadGenerator {
    const height = this.desiredSize().y;
    const lock = typeof height !== 'number' || typeof value !== 'number';

    let from: number;
    if (lock) {
      from = this.size.y();
    } else {
      from = height;
    }

    let to: number;
    if (lock) {
      this.size.y(value);
      to = this.size.y();
    } else {
      to = value;
    }

    this.size.y(from);
    lock && this.lockSize();
    yield* tween(time, value =>
      this.size.y(interpolationFunction(from, to, timingFunction(value))),
    );
    this.size.y(value);
    lock && this.releaseSize();
  }

  /**
   * Get the desired size of this node.
   *
   * @remarks
   * This method can be used to control the size using external factors.
   * By default, the returned size is the same as the one declared by the user.
   */
  @computed()
  protected desiredSize(): SerializedVector2<DesiredLength> {
    return {
      x: this.width.context.getter(),
      y: this.height.context.getter(),
    };
  }

  @threadable()
  protected *tweenSize(
    value: SignalValue<SerializedVector2<Length>>,
    time: number,
    timingFunction: TimingFunction,
    interpolationFunction: InterpolationFunction<Vector2>,
  ): ThreadGenerator {
    const size = this.desiredSize();
    let from: Vector2;
    if (typeof size.x !== 'number' || typeof size.y !== 'number') {
      from = this.size();
    } else {
      from = new Vector2(<Vector2>size);
    }

    let to: Vector2;
    if (
      typeof value === 'object' &&
      typeof value.x === 'number' &&
      typeof value.y === 'number'
    ) {
      to = new Vector2(<Vector2>value);
    } else {
      this.size(value);
      to = this.size();
    }

    this.size(from);
    this.lockSize();
    yield* tween(time, value =>
      this.size(interpolationFunction(from, to, timingFunction(value))),
    );
    this.releaseSize();
    this.size(value);
  }

  /**
   * Represents the offset of this node's origin.
   *
   * @remarks
   * By default, the origin of a node is located at its center. The origin
   * serves as the pivot point when rotating and scaling a node, but it doesn't
   * affect the placement of its children.
   *
   * The value is relative to the size of this node. A value of `1` means as far
   * to the right/bottom as possible. Here are a few examples of offsets:
   * - `[-1, -1]` - top left corner
   * - `[1, -1]` - top right corner
   * - `[0, 1]` - bottom edge
   * - `[-1, 1]` - bottom left corner
   */
  @vector2Signal('offset')
  public declare readonly offset: Vector2Signal<this>;

  /**
   * The position of the center of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the center ends up in the given place.
   *
   * If the {@link offset} has not been changed, this will be the same as the
   * {@link position}.
   *
   * When retrieved, it will return the position of the center in the parent
   * space.
   */
  @originSignal(Origin.Middle)
  public declare readonly middle: SimpleVector2Signal<this>;

  /**
   * The position of the top edge of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the top edge ends up in the given place.
   *
   * When retrieved, it will return the position of the top edge in the parent
   * space.
   */
  @originSignal(Origin.Top)
  public declare readonly top: SimpleVector2Signal<this>;
  /**
   * The position of the bottom edge of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the bottom edge ends up in the given place.
   *
   * When retrieved, it will return the position of the bottom edge in the
   * parent space.
   */
  @originSignal(Origin.Bottom)
  public declare readonly bottom: SimpleVector2Signal<this>;
  /**
   * The position of the left edge of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the left edge ends up in the given place.
   *
   * When retrieved, it will return the position of the left edge in the parent
   * space.
   */
  @originSignal(Origin.Left)
  public declare readonly left: SimpleVector2Signal<this>;
  /**
   * The position of the right edge of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the right edge ends up in the given place.
   *
   * When retrieved, it will return the position of the right edge in the parent
   * space.
   */
  @originSignal(Origin.Right)
  public declare readonly right: SimpleVector2Signal<this>;
  /**
   * The position of the top left corner of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the top left corner ends up in the given place.
   *
   * When retrieved, it will return the position of the top left corner in the
   * parent space.
   */
  @originSignal(Origin.TopLeft)
  public declare readonly topLeft: SimpleVector2Signal<this>;
  /**
   * The position of the top right corner of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the top right corner ends up in the given place.
   *
   * When retrieved, it will return the position of the top right corner in the
   * parent space.
   */
  @originSignal(Origin.TopRight)
  public declare readonly topRight: SimpleVector2Signal<this>;
  /**
   * The position of the bottom left corner of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the bottom left corner ends up in the given place.
   *
   * When retrieved, it will return the position of the bottom left corner in
   * the parent space.
   */
  @originSignal(Origin.BottomLeft)
  public declare readonly bottomLeft: SimpleVector2Signal<this>;
  /**
   * The position of the bottom right corner of this node.
   *
   * @remarks
   * When set, this shortcut property will modify the node's position so that
   * the bottom right corner ends up in the given place.
   *
   * When retrieved, it will return the position of the bottom right corner in
   * the parent space.
   */
  @originSignal(Origin.BottomRight)
  public declare readonly bottomRight: SimpleVector2Signal<this>;

  /**
   * Get the cardinal point corresponding to the given origin.
   *
   * @param origin - The origin or direction of the point.
   */
  public cardinalPoint(origin: Origin | Direction): SimpleVector2Signal<this> {
    switch (origin) {
      case Origin.TopLeft:
        return this.topLeft;
      case Origin.TopRight:
        return this.topRight;
      case Origin.BottomLeft:
        return this.bottomLeft;
      case Origin.BottomRight:
        return this.bottomRight;
      case Origin.Top:
      case Direction.Top:
        return this.top;
      case Origin.Bottom:
      case Direction.Bottom:
        return this.bottom;
      case Origin.Left:
      case Direction.Left:
        return this.left;
      case Origin.Right:
      case Direction.Right:
        return this.right;
      default:
        return this.middle;
    }
  }

  @initial(false)
  @signal()
  public declare readonly clip: SimpleSignal<boolean, this>;

  public declare yoga: YogaNode;

  @initial(0)
  @signal()
  protected declare readonly sizeLockCounter: SimpleSignal<number, this>;

  public constructor(props: LayoutProps) {
    super(props);
  }

  public lockSize() {
    this.sizeLockCounter(this.sizeLockCounter() + 1);
  }

  public releaseSize() {
    this.sizeLockCounter(this.sizeLockCounter() - 1);
  }

  @computed()
  protected parentTransform(): Layout | null {
    return this.findAncestor(is(Layout));
  }

  @computed()
  public anchorPosition() {
    const size = this.computedSize();
    const offset = this.offset();

    return size.scale(0.5).mul(offset);
  }

  /**
   * Get the resolved layout mode of this node.
   *
   * @remarks
   * When the mode is `null`, its value will be inherited from the parent.
   *
   * Use {@link layout} to get the raw mode set for this node (without
   * inheritance).
   */
  @computed()
  public layoutEnabled(): boolean {
    return this.layout() ?? this.parentTransform()?.layoutEnabled() ?? false;
  }

  @computed()
  public isLayoutRoot(): boolean {
    return !this.layoutEnabled() || !this.parentTransform()?.layoutEnabled();
  }

  public override localToParent(): DOMMatrix {
    const matrix = super.localToParent();
    const offset = this.offset();
    if (!offset.exactlyEquals(Vector2.zero)) {
      const translate = this.size().mul(offset).scale(-0.5);
      matrix.translateSelf(translate.x, translate.y);
    }

    return matrix;
  }

  /**
   * A simplified version of {@link localToParent} matrix used for transforming
   * direction vectors.
   *
   * @internal
   */
  @computed()
  protected scalingRotationMatrix(): DOMMatrix {
    const matrix = new DOMMatrix();

    matrix.rotateSelf(0, 0, this.rotation());
    matrix.scaleSelf(this.scale.x(), this.scale.y());

    const offset = this.offset();
    if (!offset.exactlyEquals(Vector2.zero)) {
      const translate = this.size().mul(offset).scale(-0.5);
      matrix.translateSelf(translate.x, translate.y);
    }

    return matrix;
  }

  protected getComputedLayout(): BBox {
    this.yoga.isReferenceBaseline();
    const layout = this.yoga.getComputedLayout();
    return new BBox(layout.left, layout.top, layout.width, layout.height);
  }

  @computed()
  public computedPosition(): Vector2 {
    this.requestLayoutUpdate();
    const box = this.getComputedLayout();

    const position = new Vector2(box.x, box.y);
    position.x += (box.width / 2) * (1 + this.offset.x());
    position.y += (box.height / 2) * (1 + this.offset.y());

    const parent = this.parentTransform();
    if (parent) {
      const parentRect = parent.getComputedLayout();
      position.x -= parentRect.width / 2;
      position.y -= parentRect.height / 2;
    }

    return position;
  }

  @computed()
  protected computedSize(): Vector2 {
    this.requestLayoutUpdate();
    return this.getComputedLayout().size;
  }

  /**
   * Find the closest layout root and apply any new layout changes.
   */
  @computed()
  protected requestLayoutUpdate() {
    const parent = this.parentTransform();
    if (this.appendedToView()) {
      parent?.requestFontUpdate();
      this.updateLayout();
      const size = this.desiredSize();
      this.yoga.calculateLayout(size.x ?? undefined, size.y ?? undefined);
    } else {
      parent!.requestLayoutUpdate();
    }
  }

  @computed()
  protected appendedToView() {
    const root = this.isLayoutRoot();
    if (root) {
      this.yoga.getParent()?.removeChild(this.yoga);
    }

    return root;
  }

  /**
   * Apply any new layout changes to this node and its children.
   */
  @computed()
  protected updateLayout() {
    this.applyFont();
    this.applyFlex();
    if (this.layoutEnabled()) {
      const children = this.layoutChildren();
      for (const child of children) {
        child.updateLayout();
      }
    }
  }

  @computed()
  protected layoutChildren(): Layout[] {
    const queue = [...this.children()];
    const result: Layout[] = [];
    const elements: YogaNode[] = [];
    while (queue.length) {
      const child = queue.shift();
      if (child instanceof Layout) {
        if (child.layoutEnabled()) {
          result.push(child);
          child.yoga.getParent()?.removeChild(child.yoga);
          elements.push(child.yoga);
        }
      } else if (child) {
        queue.unshift(...child.children());
      }
    }

    const count = this.yoga.getChildCount();
    for (let i = 0; i < count; i++) {
      this.yoga.removeChild(this.yoga.getChild(0));
    }
    for (let i = 0; i < elements.length; i++) {
      this.yoga.insertChild(elements[i], i);
    }

    return result;
  }

  /**
   * Apply any new font changes to this node and all of its ancestors.
   */
  @computed()
  protected requestFontUpdate() {
    this.appendedToView();
    this.parentTransform()?.requestFontUpdate();
    this.applyFont();
  }

  protected override getCacheBBox(): BBox {
    return BBox.fromSizeCentered(this.computedSize());
  }

  protected override draw(context: CanvasRenderingContext2D) {
    if (this.clip()) {
      const size = this.computedSize();
      if (size.width === 0 || size.height === 0) {
        return;
      }

      context.beginPath();
      context.rect(size.width / -2, size.height / -2, size.width, size.height);
      context.closePath();
      context.clip();
    }

    this.drawChildren(context);
  }

  public override drawOverlay(
    context: CanvasRenderingContext2D,
    matrix: DOMMatrix,
  ) {
    const size = this.computedSize();
    const offset = size.mul(this.offset()).scale(0.5).transformAsPoint(matrix);
    const box = BBox.fromSizeCentered(size);
    const layout = box.transformCorners(matrix);
    const padding = box
      .addSpacing(this.padding().scale(-1))
      .transformCorners(matrix);
    const margin = box.addSpacing(this.margin()).transformCorners(matrix);

    context.beginPath();
    drawLine(context, margin);
    drawLine(context, layout);
    context.closePath();
    context.fillStyle = 'rgba(255,193,125,0.6)';
    context.fill('evenodd');

    context.beginPath();
    drawLine(context, layout);
    drawLine(context, padding);
    context.closePath();
    context.fillStyle = 'rgba(180,255,147,0.6)';
    context.fill('evenodd');

    context.beginPath();
    drawLine(context, layout);
    context.closePath();
    context.lineWidth = 1;
    context.strokeStyle = 'white';
    context.stroke();

    context.beginPath();
    drawPivot(context, offset);
    context.stroke();
  }

  public getOriginDelta(origin: Origin) {
    const size = this.computedSize().scale(0.5);
    const offset = this.offset().mul(size);
    if (origin === Origin.Middle) {
      return offset.flipped;
    }

    const newOffset = originToOffset(origin).mul(size);
    return newOffset.sub(offset);
  }

  /**
   * Update the offset of this node and adjust the position to keep it in the
   * same place.
   *
   * @param offset - The new offset.
   */
  public moveOffset(offset: Vector2) {
    const size = this.computedSize().scale(0.5);
    const oldOffset = this.offset().mul(size);
    const newOffset = offset.mul(size);
    this.offset(offset);
    this.position(this.position().add(newOffset).sub(oldOffset));
  }

  protected parsePixels(value: number | null): string {
    return value === null ? '' : `${value}px`;
  }

  protected parseLength(value: number | string | null): string {
    if (value === null) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return `${value}px`;
  }

  @computed()
  protected applyFlex() {
    this.yoga.setPositionType(
      this.isLayoutRoot() ? PositionType.Absolute : PositionType.Relative,
    );

    const size = this.desiredSize();
    this.yoga.setWidth(size.x ?? undefined);
    this.yoga.setHeight(size.y ?? undefined);
    this.yoga.setMinWidth(this.minWidth() ?? undefined);
    this.yoga.setMaxWidth(this.maxWidth() ?? undefined);
    this.yoga.setMinHeight(this.minHeight() ?? undefined);
    this.yoga.setMaxHeight(this.maxHeight() ?? undefined);
    this.yoga.setAspectRatio(this.ratio() ?? undefined);

    this.yoga.setMargin(Yoga.EDGE_TOP, this.margin.top());
    this.yoga.setMargin(Yoga.EDGE_BOTTOM, this.margin.bottom());
    this.yoga.setMargin(Yoga.EDGE_LEFT, this.margin.left());
    this.yoga.setMargin(Yoga.EDGE_RIGHT, this.margin.right());

    this.yoga.setPadding(Yoga.EDGE_TOP, this.padding.top());
    this.yoga.setPadding(Yoga.EDGE_BOTTOM, this.padding.bottom());
    this.yoga.setPadding(Yoga.EDGE_LEFT, this.padding.left());
    this.yoga.setPadding(Yoga.EDGE_RIGHT, this.padding.right());

    switch (this.direction()) {
      case 'row':
        this.yoga.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        break;
      case 'row-reverse':
        this.yoga.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE);
        break;
      case 'column':
        this.yoga.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
        break;
      case 'column-reverse':
        this.yoga.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE);
        break;
    }
    this.yoga.setAspectRatio(this.ratio() ?? undefined);
    this.yoga.setFlexBasis(this.basis() ?? undefined);

    switch (this.wrap()) {
      case 'nowrap':
        this.yoga.setFlexWrap(Yoga.WRAP_NO_WRAP);
        break;
      case 'wrap':
        this.yoga.setFlexWrap(Yoga.WRAP_WRAP);
        break;
      case 'wrap-reverse':
        this.yoga.setFlexWrap(Yoga.WRAP_WRAP_REVERSE);
        break;
    }

    switch (this.justifyContent()) {
      case 'center':
        this.yoga.setJustifyContent(Yoga.JUSTIFY_CENTER);
        break;
      case 'start':
        this.yoga.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
        break;
      case 'end':
        this.yoga.setJustifyContent(Yoga.JUSTIFY_FLEX_END);
        break;
      case 'space-between':
        this.yoga.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN);
        break;
      case 'space-around':
        this.yoga.setJustifyContent(Yoga.JUSTIFY_SPACE_AROUND);
        break;
      case 'space-evenly':
        this.yoga.setJustifyContent(Yoga.JUSTIFY_SPACE_EVENLY);
        break;
    }

    switch (this.alignContent()) {
      case 'center':
        this.yoga.setAlignContent(Yoga.ALIGN_CENTER);
        break;
      case 'start':
        this.yoga.setAlignContent(Yoga.ALIGN_FLEX_START);
        break;
      case 'end':
        this.yoga.setAlignContent(Yoga.ALIGN_FLEX_END);
        break;
      case 'space-between':
        this.yoga.setAlignContent(Yoga.ALIGN_SPACE_BETWEEN);
        break;
      case 'space-around':
        this.yoga.setAlignContent(Yoga.ALIGN_SPACE_AROUND);
        break;
      case 'space-evenly':
        this.yoga.setAlignContent(Yoga.ALIGN_SPACE_EVENLY);
        break;
      case 'stretch':
        this.yoga.setAlignContent(Yoga.ALIGN_STRETCH);
        break;
    }

    switch (this.alignItems()) {
      case 'center':
        this.yoga.setAlignItems(Yoga.ALIGN_CENTER);
        break;
      case 'start':
        this.yoga.setAlignItems(Yoga.ALIGN_FLEX_START);
        break;
      case 'end':
        this.yoga.setAlignItems(Yoga.ALIGN_FLEX_END);
        break;
      case 'stretch':
        this.yoga.setAlignItems(Yoga.ALIGN_STRETCH);
        break;
      case 'baseline':
        this.yoga.setAlignItems(Yoga.ALIGN_BASELINE);
        break;
    }

    switch (this.alignSelf()) {
      case 'center':
        this.yoga.setAlignSelf(Yoga.ALIGN_CENTER);
        break;
      case 'start':
        this.yoga.setAlignSelf(Yoga.ALIGN_FLEX_START);
        break;
      case 'end':
        this.yoga.setAlignSelf(Yoga.ALIGN_FLEX_END);
        break;
      case 'stretch':
        this.yoga.setAlignSelf(Yoga.ALIGN_STRETCH);
        break;
      case 'baseline':
        this.yoga.setAlignSelf(Yoga.ALIGN_BASELINE);
        break;
    }

    this.yoga.setGap(Yoga.GUTTER_COLUMN, this.gap().x);
    this.yoga.setGap(Yoga.GUTTER_ROW, this.gap().y);

    if (this.sizeLockCounter() > 0) {
      this.yoga.setFlexGrow(0);
      this.yoga.setFlexShrink(0);
    } else {
      this.yoga.setFlexGrow(this.grow());
      this.yoga.setFlexShrink(this.shrink());
    }
  }

  protected resolveLineHeight(): number {
    const lineHeight = this.lineHeight();
    if (typeof lineHeight === 'number') {
      return lineHeight;
    }

    return (this.fontSize() * parseFloat(lineHeight as string)) / 100;
  }

  @computed()
  protected applyFont() {}

  public override dispose() {
    super.dispose();
    this.sizeLockCounter?.context.dispose();
    if (this.yoga) {
      this.yoga.freeRecursive();
    }
    this.yoga = null as unknown as YogaNode;
  }

  public override hit(position: Vector2): Node | null {
    const local = position.transformAsPoint(this.localToParent().inverse());
    if (this.cacheBBox().includes(local)) {
      return super.hit(position) ?? this;
    }

    return null;
  }
}

function originSignal(origin: Origin): PropertyDecorator {
  return (target, key) => {
    signal()(target, key);
    cloneable(false)(target, key);
    const meta = getPropertyMeta<any>(target, key);
    meta!.parser = value => new Vector2(value);
    meta!.getter = function (this: Layout) {
      return this.computedSize()
        .getOriginOffset(origin)
        .transformAsPoint(this.localToParent());
    };
    meta!.setter = function (
      this: Layout,
      value: SignalValue<PossibleVector2>,
    ) {
      this.position(
        modify(value, unwrapped =>
          this.getOriginDelta(origin)
            .transform(this.scalingRotationMatrix())
            .flipped.add(unwrapped),
        ),
      );
      return this;
    };
  };
}

addInitializer<Layout>(Layout.prototype, instance => {
  instance.yoga = Yoga.Node.create();
});
