
const axios = require('axios');

module.exports = {
    postProcessor: null,
    preProcessor: null,
    shortCircuit: null,
    debug: false,
    req: function(url, method, payload, callback) {

        if (payload) {
            payload = this.normalize(payload);
        }

        if (this.debug) console.log('ynetwork', method, url, payload);

        if (this.shortCircuit) {

            var shortCircuitResult = this.shortCircuit(url, method, payload);
            
            if (shortCircuitResult && typeof shortCircuitResult === 'object') {
                callback(shortCircuitResult.data, shortCircuitResult.status);
                return console.log('ynetwork shortcircuited', method, url);
            }

        }

        axios({
            method: method,
            url: url,
            data: payload,
        }).then((res) => {
            
            if (this.debug) console.log('ynetwork done', url, res);

            let preProcessorResult = this.preProcessor ? this.preProcessor(res.data, res.status) : null;

            if (this.preProcessor && !preProcessorResult) return console.log('ynetwork dismissed', method, url);

            if (typeof preProcessorResult === 'object') {
                res.data   = preProcessorResult.data;
                res.status = preProcessorResult.status;
            }

            if (callback) callback(res.data, res.status);

            if (this.postProcessor) this.postProcessor(res.data, res.status);

        }).catch((e) => {
            
            if (this.debug) console.log('ynetwork error', url, e);

            let _response = e.response ? e.response.data : null;
            let _status   = e.response ? e.response.status : -1;

            let preProcessorResult = this.preProcessor ? this.preProcessor(_response, _status) : null;

            if (this.preProcessor && !preProcessorResult) return console.log('ynetwork dismissed error', method, url);

            if (typeof preProcessorResult === 'object') {
                _response = preProcessorResult.data;
                _status   = preProcessorResult.status;
            }

            if (callback) callback(_response, _status);

            if (this.postProcessor) this.postProcessor(_response, _status);

        });

    },
    get: function(url, callback) {
        this.req(url, 'get', null, callback);
    },
    post: function(url, payload, callback) {
        this.req(url, 'post', payload, callback);
    },
    mockGet: function(url) {
        this.get(url, function(res, status) {
            console.log('mock of: ', url, status, res);
        });
    },
    mockPost: function(url, payload) {
        this.post(url, payload, function(res, status) {
            console.log('mock of: ', url, status, res);
        });
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
