'use strict'

import {urlEncode} from "../src/util/helpers";

describe('url encode', () => {
  it('string', () => {
    expect(urlEncode({event: 'foo'})).toBe('event=foo');
  })
})
