import {capitalize} from '@motion-canvas/core';
import {Layout} from '../components';
import {is} from '../utils';

export function defaultStyle<T>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _styleName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _parse: (value: string) => T,
): PropertyDecorator {
  return (target: any, key) => {
    target[`getDefault${capitalize(<string>key)}`] = function (this: Layout) {
      return (<any>this.findAncestor(is(Layout)))?.[key]();
    };
  };
}
