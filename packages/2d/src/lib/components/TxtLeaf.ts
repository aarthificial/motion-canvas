import {
  BBox,
  SignalValue,
  SimpleSignal,
  capitalize,
  getContext,
  lazy,
  textLerp,
} from '@motion-canvas/core';
import Yoga from 'yoga-layout';
import {
  computed,
  initial,
  interpolation,
  nodeName,
  signal,
} from '../decorators';
import {Shape, ShapeProps} from './Shape';
import {Txt} from './Txt';

export interface TxtLeafProps extends ShapeProps {
  children?: string;
  text?: SignalValue<string>;
}

@nodeName('TxtLeaf')
export class TxtLeaf extends Shape {
  @lazy(() => {
    try {
      return new (Intl as any).Segmenter(undefined, {
        granularity: 'grapheme',
      });
    } catch (e) {
      return null;
    }
  })
  protected static readonly segmenter: any;

  @initial('')
  @interpolation(textLerp)
  @signal()
  public declare readonly text: SimpleSignal<string, this>;

  public constructor({children, ...rest}: TxtLeafProps) {
    super(rest);
    if (children) {
      this.text(children);
    }
  }

  @computed()
  protected parentTxt() {
    const parent = this.parent();
    return parent instanceof Txt ? parent : null;
  }

  protected override draw(context: CanvasRenderingContext2D) {
    this.requestFontUpdate();
    this.applyStyle(context);
    this.applyText(context);

    const {width, height} = this.size();
    context.translate(-width / 2, -height / 2);

    const lineHeight = this.resolveLineHeight();
    const lineRect = new BBox();
    lineRect.height = lineHeight;

    let content = '';
    for (const textNode of this.textNodes) {
      if (lineRect.x + lineRect.width + textNode.measure.width > width) {
        lineRect.x = 0;
        lineRect.y += lineHeight;
      }

      lineRect.width += textNode.measure.width;

      if (textNode.content === ' ') {
        this.drawText(context, content, lineRect);
        content = '';
        lineRect.x += lineRect.width;
        lineRect.width = 0;
      } else {
        content += textNode.content;
      }
    }

    if (content) {
      this.drawText(context, content, lineRect);
    }
  }

  protected drawText(
    context: CanvasRenderingContext2D,
    text: string,
    box: BBox,
  ) {
    const y = box.y + box.height / 2;
    context.save();
    context.textBaseline = 'middle';
    text = text.replace(/\s+/g, ' ');

    if (this.lineWidth() <= 0) {
      context.fillText(text, box.x, y);
    } else if (this.strokeFirst()) {
      context.strokeText(text, box.x, y);
      context.fillText(text, box.x, y);
    } else {
      context.fillText(text, box.x, y);
      context.strokeText(text, box.x, y);
    }

    context.restore();
  }

  protected override getCacheBBox(): BBox {
    const size = this.computedSize();
    const range = document.createRange();
    // range.selectNodeContents(this.element);
    const bbox = range.getBoundingClientRect();

    const lineWidth = this.lineWidth();
    // We take the default value of the miterLimit as 10.
    const miterLimitCoefficient = this.lineJoin() === 'miter' ? 0.5 * 10 : 0.5;

    return new BBox(-size.width / 2, -size.height / 2, bbox.width, bbox.height)
      .expand([0, this.fontSize() * 0.5])
      .expand(lineWidth * miterLimitCoefficient);
  }

  protected override applyFlex() {
    super.applyFlex();
    // this.element.style.display = 'inline';
  }

  private textNodes: {
    content: string;
    measure: TextMetrics;
  }[] = [];

  private static readonly measureContext = getContext();

  protected override updateLayout() {
    this.applyFont();
    this.applyFlex();

    TxtLeaf.measureContext.save();
    this.applyText(TxtLeaf.measureContext);
    this.textNodes = [];

    if (TxtLeaf.segmenter) {
      for (const word of TxtLeaf.segmenter.segment(this.text())) {
        this.textNodes.push({
          content: word.segment,
          measure: TxtLeaf.measureContext.measureText(word.segment),
        });
      }
    } else {
      for (const word of this.text().split('')) {
        this.textNodes.push({
          content: word,
          measure: TxtLeaf.measureContext.measureText(word),
        });
      }
    }

    TxtLeaf.measureContext.restore();
    const desiredLines = (maxWidth: number) => {
      let x = 0;
      let width = 0;
      let lines = 1;

      for (const textNode of this.textNodes) {
        if (x + width + textNode.measure.width > maxWidth) {
          x = 0;
          lines++;
        }

        width += textNode.measure.width;

        if (textNode.content === ' ') {
          x += width;
          width = 0;
        }
      }

      return lines;
    };

    this.yoga.setMeasureFunc(
      (availableWidth, widthMode, availableHeight, heightMode) => {
        let width = 0;
        let checkHeight = false;
        if (widthMode === Yoga.MEASURE_MODE_UNDEFINED) {
          for (const textNode of this.textNodes) {
            width += textNode.measure.width;
          }
        } else if (widthMode === Yoga.MEASURE_MODE_EXACTLY) {
          width = availableWidth;
          checkHeight = true;
        } else {
          let desiredWidth = 0;
          for (const textNode of this.textNodes) {
            desiredWidth += textNode.measure.width;
          }

          if (desiredWidth <= availableWidth) {
            width = desiredWidth;
          } else {
            width = availableWidth;
            checkHeight = true;
          }
        }

        let height;
        if (heightMode === Yoga.MEASURE_MODE_UNDEFINED) {
          const lines = checkHeight ? desiredLines(width) : 1;
          height = this.resolveLineHeight() * lines;
        } else if (heightMode === Yoga.MEASURE_MODE_EXACTLY) {
          height = availableHeight;
        } else {
          const lines = checkHeight ? desiredLines(width) : 1;
          height = Math.min(availableHeight, this.resolveLineHeight() * lines);
        }

        return {
          width,
          height,
        };
      },
    );

    // Make sure the text is aligned correctly even if the text is smaller than
    // the container.
    // if (this.justifyContent.isInitial()) {
    //   this.element.style.justifyContent =
    //     this.styles.getPropertyValue('text-align');
    // }

    // const wrap =
    //   this.styles.whiteSpace !== 'nowrap' && this.styles.whiteSpace !== 'pre';

    // if (wrap) {
    //   this.element.innerText = '';
    //
    //   if (TxtLeaf.segmenter) {
    //     for (const word of TxtLeaf.segmenter.segment(this.text())) {
    //       this.element.appendChild(document.createTextNode(word.segment));
    //     }
    //   } else {
    //     for (const word of this.text().split('')) {
    //       this.element.appendChild(document.createTextNode(word));
    //     }
    //   }
    // } else if (this.styles.whiteSpace === 'pre') {
    //   this.element.innerText = '';
    //   for (const line of this.text().split('\n')) {
    //     this.element.appendChild(document.createTextNode(line + '\n'));
    //   }
    // } else {
    //   this.element.innerText = this.text();
    // }
  }
}

[
  'fill',
  'stroke',
  'lineWidth',
  'strokeFirst',
  'lineCap',
  'lineJoin',
  'lineDash',
  'lineDashOffset',
].forEach(prop => {
  (TxtLeaf.prototype as any)[`get${capitalize(prop)}`] = function (
    this: TxtLeaf,
  ) {
    return (
      (this.parentTxt() as any)?.[prop]() ??
      (this as any)[prop].context.getInitial()
    );
  };
});
