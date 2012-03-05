
var rest = require('restler'),
    crypto = require('crypto'),
    xm = require('xml-mapping');


/**
 * Contains Route53 methods
 * 
 * @param {AWSClient} awsClient The AWS client object
 * @return {Object} Object containing Route53 methods
 */

module.exports = function route53(awsClient) {

    return {

        request: function(opts) {

            var config = awsClient.config,
                timestamp = new Date(),
                signature = crypto.createHmac('sha256',config.secretKey).update(timestamp.toUTCString()).digest('base64'),
                query = opts.query || {},
                data = opts.data || {};


            // required
            if (opts.callback == null) throw new Error('No success callback defined');


            opts.apiRevision = opts.apiRevision || '2011-05-05';
            opts.baseURI = opts.baseURI || 'https://route53.amazonaws.com/';
            opts.fullURI = opts.baseURI + opts.apiRevision + '/' + opts.action;
            opts.headers = {
                'Date': timestamp.toUTCString(),
                'X-Amzn-Authorization': 'AWS3-HTTPS AWSAccessKeyId=' + config.accessKey + ',Algorithm=HmacSHA256,Signature=' + signature
            };


            // ensure defaults
            opts.method = opts.method || 'GET';


            // make request :)
            rest.request(opts.fullURI, {
                method: opts.method,
                headers: opts.headers,
                parser: rest.parsers.xml,
                query: Object.keys(query).length > 0?query:null,
                data: Object.keys(data).length > 0?xm.dump(data):null
            })
            .on('success', function(res) {
        
                if (res instanceof Error)
                    opts.callback(new Error(res));

                else
                    opts.callback(null, res);
                
            })
            .on('error', function(err) {
                opts.callback(err);
            })
            .on('fail', function(route53Error) {
                opts.callback(new Error('[Route53] ' + JSON.stringify(route53Error) ));
            });
        

        }


    };

};
