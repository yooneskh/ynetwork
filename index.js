const axios = require('axios').default;

const globalHeaders = {};
let globalDebug = false;

let globalPreprocessors = [];
let globalShortCircuits = [];

let globalRequestRunner = axiosRequestResolver;

const normalizationReplace = [
  ['0', '۰'],
  ['1', '۱'],
  ['2', '۲'],
  ['3', '۳'],
  ['4', '۴'],
  ['5', '۵'],
  ['6', '۶'],
  ['7', '۷'],
  ['8', '۸'],
  ['9', '۹']
];


async function axiosRequestResolver({ method, url, data, headers }) {

  const response = await axios({ method, url, data, headers });

  return {
    status: response.status,
    data: response.data,
    headers: response.headers
  };

}


function normalize(thing) {
  if (typeof thing === 'string') return normalizeString(thing);
  else if (thing instanceof Object) return normalizeObject(thing);
  else return thing;
}

function normalizeString(thing) {
  for (const replacement of normalizationReplace) {
    thing = thing.replace(new RegExp(replacement[1], 'g'), replacement[0]);
  } return thing;
}

function normalizeObject(thing) {
  for (const prop in thing) {
    const t = thing[prop];
    delete thing[prop];
    thing[this.normalize(prop)] = this.normalize(t);
  } return thing;
}

function log(...thing) {
  if (globalDebug) console.log(':YN:', ...thing);
}


async function processRequest(method, url, payload, headers) {

  url = normalize(url);
  if (payload) payload = normalize(payload);
  if (headers) headers = normalize(headers);

  const requestHeaders = { ...globalHeaders, ...(headers || {}) };

  log('Init', method, url, payload, requestHeaders);

  if (globalShortCircuits.length > 0) {
    for (const shortCircuit of globalShortCircuits) {

      const result = await shortCircuit({ method, url, payload, headers: requestHeaders });
      if (!result) continue

      log('ShortCircuited', method, url, payload, requestHeaders);
      return result;

    }
  }

  let responseStatus;
  let responseData;
  let responseHeaders;

  try {

    const response = await globalRequestRunner({ method, url, data: payload, headers: requestHeaders });

    responseStatus = response.status;
    responseData = response.data;
    responseHeaders = response.headers;

    log('Complete', method, url, payload, responseStatus, responseData, responseHeaders);

  }
  catch (error) {

    responseStatus = !error || !error.response ? (-1) : (error.response.status);
    responseData = !error ? (undefined) : (!error.response ? (error.message) : (error.response.data));
    responseHeaders = !error || !error.response ? (undefined) : (error.response.headers);

    log('Error', method, url, payload, responseStatus, responseData, requestHeaders);

  }

  if (globalPreprocessors.length > 0) {
    for (const preprocessor of globalPreprocessors) {

      const result = await preprocessor({ method, url, payload, headers: requestHeaders, status: responseStatus, data: responseData, responseHeaders });
      if (!result) return;

      if (result === true) {
        log('Dismissed', method, url, payload, requestHeaders, responseStatus, responseData, requestHeaders);
        return { status: -2, data: undefined, headers: {} };
      }

      responseStatus = result.status;
      responseData = result.data;
      responseHeaders = result.headers;

      log('PreProcessed', method, url, payload, requestHeaders, responseStatus, responseData, requestHeaders);

    }
  }

  return {
    status: responseStatus,
    data: responseData,
    headers: responseHeaders
  };

}


module.exports.YNetwork = {
  setDebug(debug) {
    globalDebug = debug;
  },
  applyHeader(header, value) {
    if (value === null || value === undefined || value === '') {
      delete globalHeaders[header];
    }
    else {
      globalHeaders[header] = value;
    }
  },
  removeHeader(header) {
    delete globalHeaders[header];
  },
  applyPreprocessor(preprocessor) {
    globalPreprocessors.push(preprocessor);
  },
  applyShortCircuit(shortCircuit) {
    globalShortCircuits.push(shortCircuit);
  },
  setRequestRunner(runner) {
    globalRequestRunner = runner;
  },
  async get(url, payload, headers) {
    return processRequest('get', url, payload, headers);
  },
  async post(url, payload, headers) {
    return processRequest('post', url, payload, headers);
  },
  async put(url, payload, headers) {
    return processRequest('put', url, payload, headers);
  },
  async patch(url, payload, headers) {
    return processRequest('patch', url, payload, headers);
  },
  async delete(url, payload, headers) {
    return processRequest('delete', url, payload, headers);
  },
  async head(url, payload, headers) {
    return processRequest('head', url, payload, headers);
  },
  normalize
};
