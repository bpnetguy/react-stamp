import keys from 'lodash/object/keys';
import React from 'react';
import test from 'tape';

import reactStamp from '../src';
import { compose } from '../src/utils';

test('reactStamp(React, props).compose(stamp2)', (t) => {
  t.plan(1);

  const mixin = reactStamp(null, {
    method() {
      return 'mixin';
    },
  });

  const stamp = reactStamp(React).compose(mixin);

  t.equal(
    stamp().method(), 'mixin',
    'should return a stamp composed of `this` and passed stamp'
  );
});

test('reactStamp(React, props).compose(pojo)', (t) => {
  t.plan(1);

  const mixin = {
    method() {
      return 'mixin';
    },
  };

  const stamp = reactStamp(React).compose(mixin);

  t.equal(
    stamp().method(), 'mixin',
    'should return a stamp composed of `this` and passed pojo'
  );
});

test('reactStamp(React, props).compose(stamp2, stamp3)', (t) => {
  t.plan(2);

  const mixin1 = reactStamp(null, {
    method() {
      return this.state;
    },
  });

  const mixin2 = reactStamp(null, {
    statics: {
      util() {
        return 'static';
      },
    },
  });

  const stamp = reactStamp(React, {
    state: {
      foo: '',
    },
  }).compose(mixin1, mixin2);

  t.deepEqual(
    keys(stamp().method()), ['foo'],
    'should expose `this` to inherited methods'
  );

  t.equal(
    stamp.util(), 'static',
    'should inherit static methods'
  );
});

test('compose(stamp2, stamp1)', (t) => {
  t.plan(1);

  const mixin = reactStamp(null, {
    method() {
      return 'mixin';
    },
  });

  const stamp = reactStamp(React);

  t.equal(
    compose(mixin, stamp)().method(), 'mixin',
    'should return a stamp composed of passed stamps'
  );
});

test('stamps composed of stamps with state', (t) => {
  t.plan(2);

  const mixin = reactStamp(null, {
    state: {
      foo: ' ',
    },
  });

  const stamp = reactStamp(React, {
    state: {
      bar: ' ',
    },
  }).compose(mixin);

  const failStamp = reactStamp(React, {
    state: {
      foo: ' ',
    },
  });

  t.deepEqual(
     stamp().state, { foo: ' ', bar: ' ' },
    'should inherit state'
  );

  t.throws(
    () => failStamp.compose(mixin), TypeError,
    'should throw on duplicate keys'
  );
});

test('stamps composed of stamps with React statics', (t) => {
  t.plan(8);

  const mixin = reactStamp(null, {
    contextTypes: {
      foo: React.PropTypes.string,
    },
    childContextTypes: {
      foo: React.PropTypes.string,
    },
    propTypes: {
      foo: React.PropTypes.string,
    },
    defaultProps: {
      foo: 'foo',
    },
  });

  const stamp = reactStamp(React, {
    contextTypes: {
      bar: React.PropTypes.string,
    },
    childContextTypes: {
      bar: React.PropTypes.string,
    },
    propTypes: {
      bar: React.PropTypes.string,
    },
    defaultProps: {
      bar: 'bar',
    },
  }).compose(mixin);

  const failStamp1 = reactStamp(React, {
    propTypes: {
      foo: React.PropTypes.string,
    },
  });

  const failStamp2 = reactStamp(React, {
    defaultProps: {
      foo: 'foo',
    },
  });

  const okStamp1 = reactStamp(React, {
    contextTypes: {
      foo: React.PropTypes.string,
    },
  });

  const okStamp2 = reactStamp(React, {
    childContextTypes: {
      foo: React.PropTypes.string,
    },
  });

  t.deepEqual(
    keys(stamp.contextTypes), ['bar', 'foo'],
    'should inherit `contextTypes` props'
  );

  t.deepEqual(
    keys(stamp.childContextTypes), ['bar', 'foo'],
    'should inherit `childContextTypes` props'
  );

  t.deepEqual(
    keys(stamp.propTypes), ['bar', 'foo'],
    'should inherit `propTypes` props'
  );

  t.deepEqual(
    keys(stamp.defaultProps), ['bar', 'foo'],
    'should inherit `defaultProps` props'
  );

  t.throws(
    () => failStamp1.compose(mixin), TypeError,
    'should throw on duplicate keys in `propTypes`'
  );

  t.throws(
    () => failStamp2.compose(mixin), TypeError,
    'should throw on duplicate keys in `defaultProps`'
  );

  t.doesNotThrow(
    () => okStamp1.compose(mixin),
    'should not throw on duplicate keys in `contextTypes`'
  );

  t.doesNotThrow(
    () => okStamp2.compose(mixin),
    'should not throw on duplicate keys in `childContextTypes`'
  );
});

test('stamps composed of stamps with non-React statics', (t) => {
  t.plan(2);

  const mixin = reactStamp(null, {
    statics: {
      obj: {
        foo: 'foo',
        bar: 'bar',
      },
      method() {
        return 'foo';
      },
    },
  });

  const stamp = reactStamp(React, {
    statics: {
      obj: {
        bar: '',
      },
      method() {
        return 'bar';
      },
    },
  }).compose(mixin);

  t.deepEqual(
    stamp.obj, { bar: 'bar', foo: 'foo' },
    'should inherit static objects overriding with last-in priority'
  );

  t.equal(
    stamp.method(), 'foo',
    'should inherit static methods overriding with last-in priority'
  );
});

test('stamps composed of stamps with mixable methods', (t) => {
  t.plan(2);

  const mixin1 = reactStamp(null, {
    getChildContext() {
      return {
        bar: '',
      };
    },

    componentDidMount() {
      this.state.mixin1 = true;
    },
  });

  const mixin2 = reactStamp(null, {
    componentDidMount() {
      this.state.mixin2 = true;
    },
  });

  const stamp = reactStamp(React, {
    state: {
      stamp: false,
      mixin1: false,
      mixin2: false,
    },

    getChildContext() {
      return {
        foo: '',
      };
    },

    componentDidMount() {
      this.state.stamp = true;
    },
  }).compose(mixin1, mixin2);

  const instance = stamp();
  instance.componentDidMount();

  t.deepEqual(
    instance.state, { stamp: true, mixin1: true, mixin2: true },
    'should inherit functionality of mixable methods'
  );

  t.deepEqual(
    keys(instance.getChildContext()), ['foo', 'bar'],
    'should inherit functionality of getChildContext'
  );
});

test('stamps composed of stamps with non-mixable methods', (t) => {
  t.plan(1);

  const mixin = reactStamp(null, {
    render() {},
  });

  const stamp = reactStamp(React, {
    render() {},
  });

  t.throws(
    () => stamp.compose(mixin), TypeError,
    'should throw on duplicate methods'
  );
});
