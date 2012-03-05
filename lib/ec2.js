
var rest = require('restler'),
    crypto = require('crypto'),
    xm = require('xml-mapping'),
    qs = require('querystring');


/**
 * Contains EC2 methods
 * 
 * @param {AWSClient} awsClient The AWS client object
 * @return {Object} Object containing EC2 methods
 */

module.exports = function ec2(awsClient) {

    return {

        request: function(opts) {

            var config = awsClient.config,
                timestamp = new Date(),
                query = opts.query || {},
                data = opts.data || {};


            // required
            if (opts.callback == null) throw new Error('No callback defined');
            if (opts.action == null) throw new Error('No EC2 action defined');


            opts.apiRevision = opts.apiRevision || '2011-12-15';
            opts.hostname = opts.hostname || 'ec2.amazonaws.com';
            opts.baseURI = opts.baseURI || 'https://' + opts.hostname;
            opts.headers = opts.headers || {
                'Content-type': 'application/x-www-form-urlencoded; charset=utf-8'
            };


            // ensure defaults
            opts.method = opts.method || 'POST';


            // remap required variables into data object
            data.Action = opts.action;
            data.Version = opts.apiRevision;
            data.AWSAccessKeyId = config.accessKey;
            data.Timestamp = timestamp.toISOString();
            data.SignatureMethod = 'HmacSHA256';
            data.SignatureVersion = 2;


                // for the aws api, we must sort body data for the signature
            var sortedQuery = sortObject(opts.data),

                // signature prep
                signData = [opts.method, opts.hostname.toLowerCase(), '/', qs.stringify(sortedQuery)].join('\n'),
                
                // create signature
                signature = crypto.createHmac('sha256',config.secretKey).update( signData ).digest('base64');


            // add signature back into data bucket
            data.Signature = signature;

            // create final URI
            opts.fullURI = opts.baseURI;


            // make request :)
            rest.request(opts.fullURI, {
                method: opts.method,
                headers: opts.headers,
                parser: rest.parsers.xml,
                query: Object.keys(query).length > 0?query:null,
                data: Object.keys(data).length > 0?data:null
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
            .on('fail', function(ec2Error) {
                
                var errors = [];

                for (var error in ec2Error.Errors) {
                    errors.push(ec2Error.Errors[error].Message)
                }

                opts.callback( new Error('[EC2] ' + errors.join(' ')) );
            });

        }


    };

};


/**
 * Utility method to sort and unsorted object by keys
 * 
 * @param {Object} unsortedObject An object needing sorting
 * @return {Object} sortedObject A sorted object
 */

var sortObject = function(unsortedObject) {

    var keys = [],
        sortedObject = {};

    for (var key in unsortedObject) {
        keys.push(key);
    }

    keys = keys.sort();
    
    for (var n in keys) {
        if (keys.hasOwnProperty(n)) {
            var key = keys[n];
            sortedObject[key] = unsortedObject[key];
        }
    }

    return(sortedObject);
};
