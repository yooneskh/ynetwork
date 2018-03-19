
const axios = require('axios');

module.exports = {
    postProcessor: null,
    debug: false,
    req: function(url, method, payload, callback) {

        if (payload) {
            payload = this.normalize(payload);
        }

        if (this.debug) console.log('ynetwork', method, url, payload);

        axios({
            method: method,
            url: url,
            data: payload,
        }).then(function(res) {
            if (this.debug) console.log('ynetwork done', url, res);
            if (callback) callback(res.data, res.status);
            if (this.postProcessor) this.postProcessor(res.data, res.status);
        }.bind(this)).catch(function(e) {
            if (this.debug) console.log('ynetwork error', url, e);
            if (callback) callback(e.response ? e.response.data : null, e.response ? e.response.status : -1);
            if (this.postProcessor) this.postProcessor(e.response ? e.response.data : null, e.response ? e.response.status : -1);
        }.bind(this));

    },
    get: function(url, callback) {
        this.req(url, 'get', null, callback);
    },
    post: function(url, payload, callback) {
        this.req(url, 'post', payload, callback);
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
