export function assert(cond, message = null) {
  if (process.env.NODE_ENV !== 'production') {
    if (!cond) {
      debugger;
      throw new Error(message || 'An Assertion failed.');
    }
  }
}