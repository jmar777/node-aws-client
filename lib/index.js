
var ec2 = require('./ec2'),
    route53 = require('./route53');


/**
 * Constructs AWS client object
 * 
 * @param {Object} config Object containing required config options (accessKey, secretKey)
 * @return {AWSClient}
 */

var AWSClient = module.exports = function AWSClient(config) {
    
    var self = this;

    if (typeof config == 'undefined' || typeof config != 'object')
        throw new Error('Client received no configuration');

    if (config.accessKey == null || config.secretKey == null)
        throw new Error('Amazon AWS credentials are not provided');

    
    self.config = config;

    self.ec2 = ec2(self);
    self.route53 = route53(self);

};
