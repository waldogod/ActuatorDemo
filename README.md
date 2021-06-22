# ActuatorDemo


This is a demo to illustrate how the Spring Boot Admin Console can monitor the actuator endpoints to collect controller metrics aggregated by http response codes. 


## Demo was created using Spring Initializr site 

### Simple Service 

These are the spring initializr settings (https://start.spring.io/)

Spring Boot 2.4.7 
Gradle Java Jar Java 11 

#### Dependencies
* Code Centric Spring Boot Admin Client 
* Spring Web 
* Spring Boot Actuator 




### Spring Boot Admin Server 

These are the spring initializr settings (https://start.spring.io/)

Spring Boot 2.4.7 
Gradle Java Jar Java 11 

#### Dependencies
* Code Centric Spring Boot Admin Server 


## JMeter 5.4.1
Tested with Jmeter to create a load on the controllers that are being monitored. 



## Actuator Endpoints with query parameters

<pre>
http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller1/**,outcome:SUCCESS
http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller2/**,outcome:SUCCESS
http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller3/**,outcome:SUCCESS

http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller1/**,outcome:CLIENT_ERROR
http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller2/**,outcome:CLIENT_ERROR
http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller3/**,outcome:CLIENT_ERROR

http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller1/**,outcome:SERVER_ERROR
http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller2/**,outcome:SERVER_ERROR
http://localhost:8080/actuator/metrics/http.server.requests?tag=method:GET,uri:/demo/controller3/**,outcome:SERVER_ERROR
</pre>