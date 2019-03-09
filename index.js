
const axios = require('axios');

module.exports = {
    debug: false,
    preProcessor: null,
    shortCircuit: null,
    async req(method, url, payload, headers) {

        if (payload) payload = this.normalize(payload);

        if (this.debug) {
            console.log('ynetwork', method, url, payload);
        }

        if (this.shortCircuit) {

            const shortCircuitResult = this.shortCircuit(url, method, payload);
            
            if (shortCircuitResult && typeof shortCircuitResult === 'object') {

                console.log('ynetwork shortcircuited', method, url);

                return {result: shortCircuitResult.data, status: shortCircuitResult.status}

            }

        }

        let status, response;

        try {

            const result = await axios({method: method, url: url, data: payload, headers: headers});

            status = result.status;
            response = result.data;

            if (this.debug) {
                console.log('ynetwork done', url, status, response);
            }

        }
        catch (error) {
            
            status = error.response ? error.response.status : -1;
            response = error.response ? error.response.data : null;

            if (this.debug) {
                console.log('ynetwork error', url, response, error);
            }

        }

        const preProcessorResult = this.preProcessor ? this.preProcessor(method, url, payload, status, response) : null;

        if (this.preProcessor && preProcessorResult) {
            if (typeof preProcessorResult === 'object') {
                response = preProcessorResult.data;
                status   = preProcessorResult.status;
            }
            else if (preProcessorResult === true) {
                console.log('ynetwork dismissed', method, url);
                return {status: 0, result: null}
            }
        }

        return {status: status, result: response};

    },
    async get(url, payload, headers) {
        return this.req('get', url, payload || null, headers || null);
    },
    async post(url, payload, headers) {
        return this.req('post', url, payload, headers || null);
    },
    async patch(url, payload, headers) {
        return this.req('patch', url, payload, headers || null);
    },
    async delete(url, payload, headers) {
        return this.req('delete', url, payload, headers || null);
    },
    async put(url, payload, headers) {
        return this.req('put', url, payload, headers || null);
    },
    async head(url, payload, headers) {
        return this.req('head', url, payload, headers || null);
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
