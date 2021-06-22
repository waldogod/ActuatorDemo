package com.example.simpleservice.controller;

import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.simpleservice.dto.ResponseData;

@RestController
@RequestMapping(value= { "/demo" })
public class SampleController {

	private static final Logger LOGGER = LoggerFactory.getLogger(SampleController.class);
	
	@GetMapping(value = "/controller1/**", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<ResponseData> controller1()
	{
		ResponseData responseData = new ResponseData();
		responseData.setName("First");
		responseData.setCode(1);
				
		HttpStatus httpStatus = getRandomStatus();
		
		LOGGER.info("httpStatus:" + httpStatus.toString());
		return new ResponseEntity<ResponseData>(responseData, httpStatus);
	}
	
	
	@GetMapping(value = "/controller2/**", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<ResponseData> controller2()
	{
		ResponseData responseData = new ResponseData();
		responseData.setName("Second");
		responseData.setCode(2);
				
		HttpStatus httpStatus = getRandomStatus();
		
		LOGGER.info("httpStatus:" + httpStatus.toString());
		return new ResponseEntity<ResponseData>(responseData, httpStatus);
	}
	
	@GetMapping(value = "/controller3/**", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<ResponseData> controller3()
	{
		ResponseData responseData = new ResponseData();
		responseData.setName("Third");
		responseData.setCode(3);
				
		HttpStatus httpStatus = getRandomStatus();
		
		LOGGER.info("httpStatus:" + httpStatus.toString());
		return new ResponseEntity<ResponseData>(responseData, httpStatus);
	}
	
	private final Random random = new Random();
	private static final int MAX_VALUES = 4;
	
	private HttpStatus getRandomStatus()
	{
		HttpStatus httpStatus = HttpStatus.OK;
		
		int value = random.nextInt(MAX_VALUES);
		
		switch (value) {
		case 0:
			httpStatus = HttpStatus.OK;
			break;

		case 1:
			httpStatus = HttpStatus.BAD_REQUEST;
			break;
			
		case 2:
			httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
			break;
			
		case 3:
		default:
			httpStatus = HttpStatus.BAD_GATEWAY;
			break;
		}

		return httpStatus;
	}
	
}
