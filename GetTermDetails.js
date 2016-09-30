var jasperHelper = require('./jasperHelper');

module.exports = function(RED) {
    "use strict";

    function GetTermDetailsNode(n) {
    	RED.nodes.createNode(this,n);
        var node = this;
        node.args = JSON.parse(JSON.stringify(n));
        var options = {};
        var url = node.args.url || "https://apitest.jasperwireless.com";
        var fullUrl = url + '/ws/schema/Terminal.wsdl';

        
        jasperHelper.createClient(fullUrl, options, function(err, c){
        	if(err)
                node.error('SOAP client error: ' + err);
            else
                console.log('SOAP client connected');
        	node.clientError = err;
        	node.client = c;
        });

        node.on("input", function(msg){
            try {
                if(node.clientError) {
                	jasperHelper.handleError(node, node.clientError, msg);
                }
                else if(!node.client){
                	jasperHelper.handleError(node, 'failed to create client.', msg);
                }
                else if(!node.client['GetTerminalDetails']){
                	jasperHelper.handleError(node, 'no such API method', msg);
                }
                else{
                    var client = node.client;

                	var username = msg.username || node.args.username;
        			var password = msg.password || node.args.password;
                    client.setSecurity(jasperHelper.createWSSecurity(username, password));
                    var args = jasperHelper.initArgs(node.args, msg);
                    var iccids = msg.topic || node.args.ICCID;
                    if(!iccids)
                    	return node.error('Missing iccid.');
                    iccids = iccids.split(',');
                    args.iccids ={};
                    args.iccids.iccid = iccids[0];
                    client['GetTerminalDetails'](args, function(err, res) {
	                    if(!err){
	                        msg.payload = res;
	                        node.send(msg);
	                    } else{
	                        jasperHelper.handleError(node, jasperHelper.parseError1(err), msg);
	                    }
	                });

                }
            }
            catch(e){
                jasperHelper.handleError(node, e, msg);
            }
        });
		
	}

        RED.nodes.registerType("SIM Details",GetTermDetailsNode);
}