const axios = require('axios').default;

async function axiosRequestResolver({ method, url, data, headers }) {

  const response = await axios({ method, url, data, headers });

  return {
    status: response.status,
    data: response.data,
    headers: response.headers
  };

}

module.exports = {
  debug: false,
  preProcessor: undefined,
  shortCircuit: undefined,
  headers: { },
  requestRunner: axiosRequestResolver,
  async req(method, url, payload, headers) {

    if (payload) payload = this.normalize(payload);
    url = this.normalizeString(url);

    const requestHeaders = { ...this.headers, ...headers };

    if (this.debug) {
      console.log('-> ynetwork init', { method, url, payload, requestHeaders });
    }

    if (this.shortCircuit) {

      const shortCircuitResult = this.shortCircuit(url, method, payload);

      if (shortCircuitResult && typeof shortCircuitResult === 'object') {
        console.log('-> ynetwork shortcircuited', { method, url });
        return { result: shortCircuitResult.data, status: shortCircuitResult.status }
      }

    }

    let status;
    let response;
    let responseHeaders;

    try {

      const result = await this.requestRunner({ method, url, data: payload, headers: requestHeaders });

      status = result.status;
      response = result.data;
      responseHeaders = result.headers;

      if (this.debug) {
        console.log('-> ynetwork done', { url, status, response, headers: responseHeaders });
      }

    }
    catch (error) {

      status = error.response ? error.response.status : -1;
      response = error.response ? error.response.data : undefined;
      responseHeaders = error.response ? error.response.headers : undefined;

      if (this.debug) {
        console.log('-> ynetwork error', { method, url, response, error, headers: responseHeaders });
      }

    }

    const preProcessorResult = this.preProcessor ? this.preProcessor(method, url, payload, status, response) : undefined;
    if (this.preProcessor && preProcessorResult) {
      if (typeof preProcessorResult === 'object') {
        response        = preProcessorResult.data;
        status          = preProcessorResult.status;
        responseHeaders = preProcessorResult.headers;
      }
      else if (preProcessorResult === true) {
        console.log('-> ynetwork dismissed', { method, url, headers: requestHeaders });
        return { status: 0, result: undefined, headers: {} };
      }
    }

    return { status: status, result: response, headers: responseHeaders };

  },
  async get(url, payload, headers) {
    return this.req('get', url, payload || undefined, headers || {});
  },
  async post(url, payload, headers) {
    return this.req('post', url, payload, headers || {});
  },
  async patch(url, payload, headers) {
    return this.req('patch', url, payload, headers || {});
  },
  async delete(url, payload, headers) {
    return this.req('delete', url, payload, headers || {});
  },
  async put(url, payload, headers) {
    return this.req('put', url, payload, headers || {});
  },
  async head(url, payload, headers) {
    return this.req('head', url, payload, headers || {});
  },
  normalize: function (thing) {
    if (typeof thing === 'string') return this.normalizeString(thing);
    else if (thing instanceof Object) return this.normalizeObject(thing);
    else return thing;
  },
  normalizeString: function (text) {

    var replaces = ['0۰', '1۱', '2۲', '3۳', '4۴', '5۵', '6۶', '7۷', '8۸', '9۹'];

    for (var i = 0; i < replaces.length; i++) {
      text = text.replace(new RegExp(replaces[i][1], 'g'), replaces[i][0]);
    }

    return text;

  },
  normalizeObject: function (object) {
    for (var prop in object) {
      if (object.hasOwnProperty(prop)) {
        var t = object[prop];
        delete object[prop];
        object[this.normalize(prop)] = this.normalize(t);
      }
    } return object;
  }
}
