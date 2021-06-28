const http = require('http');

const config_data = require('./config.json')
var format = require("string-template")

const metrics_path_template = "/actuator/metrics/http.server.requests?tag=method:{0},uri:{1},outcome:{2}";
const metrics_outcomes = [ "SUCCESS", "CLIENT_ERROR", "SERVER_ERROR"];


function pad(n) { return n < 10 ? '0' + n : n }


async function  main() {

    console.log( "Config file:" );
    console.log( JSON.stringify(config_data) );



    // This gets included in the elasticsearch metrics
    const service = {
        name: config_data.service,
        ipaddr: config_data.ipaddr,
        port: config_data.port,

    };

 
    const metricValues = await collectMetrics( config_data, service );

    console.log( "MetricValues:" + JSON.stringify(metricValues) + "\n" );

	const esBody = buildESBody(metricValues, service);

	console.log( "buildESBody:" );
	console.log( JSON.stringify(esBody) );

	const postMetricResult = await sendESBodyToES(esBody, service);

	console.log( "postMetricResult:" );
	console.log( JSON.stringify(postMetricResult) );


	// This makes use keep polling 
    await new Promise(resolve => setTimeout(resolve, 10000));
    await main();
}


async function collectMetrics( configdata, service ) {

    const methodName = "GET";
    const controllers = configdata.controllers;
    console.log( "Controllers:" )
    console.log(  controllers );


        const controller = "/demo/controller1/**";

        let methodNames = [] ;

        if(controllers[controller]) {

        	methodNames = methodNames.concat(controllers[controller]);
        }

    console.log( methodNames );


  	let allServiceMetricPromises = [];

  	// We will iterate over controller names 
	var controllerNames  = Object.keys(controllers);

	for (var i = 0; i < controllerNames.length; i++) {
		controllerName = controllerNames[i]

    	// For each method we collect the promises for each of the outcomes 
    	for ( const outcomeValue of metrics_outcomes ) {


       		var metric_path = format( metrics_path_template, [ methodName, controllerName, outcomeValue ] );


        		// This gets included in the elasticsearch metrics
                const requestContext = {
                            metricsPath: metric_path,
                            controller: controllerName,
                            method: methodName,
                            outcome: outcomeValue
                };

                // This is used to call the actuator endpoint
                const requestParams = {
                            host: configdata.ipaddr,
                            method: methodName,
                            path: metric_path,
                            port: configdata.port,
                            timeout: 5000
                };


	        console.log(  requestParams );

	 		const serviceMetricPromise = getSpringMetricInfo(service, requestContext, requestParams);
	        allServiceMetricPromises.push(serviceMetricPromise);

    	}

    }

 	// Waiting for all metric info requests to finish for particular service
    const results = await Promise.allSettled(allServiceMetricPromises);

    const errors = results
        		.filter(res => res.status === 'rejected')
        		.map(rej => rej.reason);

    if (errors.length > 0) {
        	// Even though some metrics were successfully gathered, we should still fail so that
        	// developers are aware there are metrics that are not being collected.
        	throw errors;
    }

    const values = results
        	.filter(res => res.status === 'fulfilled')
        	.map(res => res.value);

   	return values;
}




async function getSpringMetricInfo(service, requestContext, requestParams) {
    return new Promise((resolve, reject) => {
        console.debug(`Getting metric "${requestParams.path}" for ${service.name}:${service.ipaddr}`);
        const name = pathToName(requestParams.path);
        const req = http.request(requestParams, res => {
            let data = '';
            if (res.statusCode == 200) {
                // Succeeded, do nothing
            } else if (res.statusCode == 404) {
                console.log(`Metric "${requestParams.path}" not found for ${service.name}:${service.ipaddr}: %j`, res);
                resolve('{}');
            } else {
                console.error(`Failed to get metric "${requestParams.path}" for ${service.name}:${service.ipaddr}: %j`, res);
                reject({ responseCode: res.statusCode, serviceName: service.name, name: name });
            }


            res.on('data', d => {
                data += d;
            });
            res.on('end', () => {

            	// We add the service data into the response data so it can be used to format it for ES.
            	var responseData = JSON.parse(data);
            	responseData.controller = requestContext.controller;
            	responseData.method = requestContext.method;
            	responseData.outcome = requestContext.outcome;

                resolve(responseData);
            });
        }).on('timeout', () => {
            req.destroy();
        }).on('error', (err) => {
            let responseCode = 500;
            if (err.code === "ECONNRESET") {
                // for timeout
                responseCode = 522;
            }
            console.error(`Failed to get metric "${requestParams.path}" for ${service.name}:${service.ipaddr}: %j`, err);
            reject({ responseCode: responseCode, serviceName: service.name, name: name, requestParams: requestParams, error: err });
        });
        req.end();
    });

    function pathToName(fullPath) {
        const path = fullPath.split("?")[0];
        const pathName = path.substr(path.lastIndexOf('/') + 1, path.length);
        const params = fullPath.split("?")[1];
        const name = [pathName, params].filter(Boolean).join("?");
        return name;
    }
}




function buildESBody(metricsValues, service) {
    const now = new Date()
    const timestamp = now.getUTCFullYear() +
        '-' + pad(now.getMonth() + 1) +
        '-' + pad(now.getDate()) +
        'T' + pad(now.getUTCHours()) +
        ':' + pad(now.getUTCMinutes()) +
        ':' + pad(now.getUTCSeconds()) + 
        '.' + pad(now.getUTCMilliseconds()) + 'Z';
 
    let metrics = {};

    for (const metricValue of metricsValues) {

	console.log( metricValue );

        const metricJson = metricValue;


        if (metricJson.hasOwnProperty('name')) {

        	if(typeof metrics[metricJson.name] === 'undefined') {
				// does not exist
				metrics[metricJson.name] = {};
			}

            if (metricJson.hasOwnProperty('controller'))  {  

				if(typeof metrics[metricJson.name][metricJson.controller] === 'undefined') {
				    // does not exist
				    metrics[metricJson.name][metricJson.controller] = {};
				}

            	if (metricJson.hasOwnProperty('method'))  {  

					if(typeof metrics[metricJson.name][metricJson.controller][metricJson.method] === 'undefined') {
				    	// does not exist
				    	metrics[metricJson.name][metricJson.controller][metricJson.method] = {};
					}

					if (metricJson.hasOwnProperty('outcome'))  {  

						if(typeof metrics[metricJson.name][metricJson.controller][metricJson.method][metricJson.outcome] === 'undefined') {
				    		// does not exist
				    		metrics[metricJson.name][metricJson.controller][metricJson.method][metricJson.outcome] = {};
						}

			            if (metricJson.hasOwnProperty('measurements')) {
			                for (const measurement of metricJson.measurements) {
			                    metrics[metricJson.name][metricJson.controller][metricJson.method][metricJson.outcome][measurement.statistic] = measurement.value;
			                }
			                metrics[metricJson.name][metricJson.controller][metricJson.method][metricJson.outcome]["baseUnit"]= metricJson.baseUnit;

			            } else {
			                metrics[metricJson.name][metricJson.controller][metricJson.method][metricJson.outcome]["RESPONSECODE"] = metricJson.responseCode;
			            }

	        		}
            	}
            }
        } 

    }

    console.log( "Metrics");
    console.log( JSON.stringify(metrics) );

    const ESBody = {
    	"@timestamp": timestamp,
        "service": service.name,
        "ipaddr":  service.ipaddr || null,
        "port" :   service.port,
        "metrics": metrics,
    };
    return ESBody;
}


async function sendESBodyToES(esBody, service) {

	const esBodyString = JSON.stringify(esBody);

	const postPath = "/" + config_data.elasticsearch.namespace + "/_doc";

	const requestParams = {
                            host: config_data.elasticsearch.host,
                            method: "POST",
                            path: postPath,
                            port: config_data.elasticsearch.port,
                            headers: {
      							'Content-Type': 'application/json',
      							'Content-Length': Buffer.byteLength(esBodyString)
    						},
                            timeout: 50000
    };

    console.log( "requestParams" );
    console.log( requestParams );


    return new Promise((resolve, reject) => {
        console.debug(`Posting metrics to "${requestParams.path}" for ${service.name}:${service.ipaddr}`);

        let responseCode = 500;
		let data = '';

        const req = http.request(requestParams, res => {

        	res.setEncoding('utf8');
        	responseCode = res.statusCode;

            if (res.statusCode == 200) {
                // Succeeded, do nothing
                console.log ( "Success posting .... ");
            } else if (res.statusCode == 404) {
                console.log(`Posted metric to "${requestParams.path}" not found for ${service.name}:${service.ipaddr}: %j`, res);
            } else {
                console.error(`POST failed for metric 1 "${requestParams.path}" for ${service.name}:${service.ipaddr} responseCode: %j`, res.statusCode);
            }

            
            res.on('data', d => {
                data += d;
            });

            res.on('end', () => {
            	console.log('No more data in response.');
            	console.log ( "Response:");
        		console.log (  data );
            });


        }).on('timeout', () => {
            req.destroy();
            reject({ responseCode: responseCode, serviceName: service.name, requestParams: requestParams, error: err });

        }).on('error', (err) => {
            if (err.code === "ECONNRESET") {
                // for timeout
                responseCode = 522;
            }
            console.error(`Failed to POST metric 2"${requestParams.path}" for ${service.name}:${service.ipaddr}: %j`, err);
            reject({ responseCode: responseCode, serviceName: service.name, requestParams: requestParams, error: err });
        });

        req.write(esBodyString);
        req.end();

        //var responseData = JSON.parse(data);
        console.log ( "Response:");
        console.log (  data );

        resolve(data);

    });

}



main();


