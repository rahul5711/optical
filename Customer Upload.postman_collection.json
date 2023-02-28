{
	"info": {
		"_postman_id": "c2018d5f-f72c-4c24-8f0f-4852142afa2f",
		"name": "Customer Upload",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "upload file",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "selectedshop",
						"value": "[\"1\"]",
						"type": "default"
					}
				],
				"body": {
					"mode": "formdata",
					"formdata": [
						{
							"key": "file",
							"type": "file",
							"src": "/C:/Users/Dell/Downloads/customerfileupload.xlsx"
						}
					]
				},
				"url": {
					"raw": "localhost:3000/file/customer",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"file",
						"customer"
					]
				}
			},
			"response": [
				{
					"name": "upload file",
					"originalRequest": {
						"method": "POST",
						"header": [
							{
								"key": "selectedshop",
								"value": "[\"1\"]",
								"type": "default"
							}
						],
						"body": {
							"mode": "formdata",
							"formdata": [
								{
									"key": "file",
									"type": "file",
									"src": "/C:/Users/Dell/Downloads/customerfileupload.xlsx"
								}
							]
						},
						"url": {
							"raw": "localhost:3000/file/customer",
							"host": [
								"localhost"
							],
							"port": "3000",
							"path": [
								"file",
								"customer"
							]
						}
					},
					"status": "OK",
					"code": 200,
					"_postman_previewlanguage": "json",
					"header": [
						{
							"key": "X-Powered-By",
							"value": "Express"
						},
						{
							"key": "Access-Control-Allow-Origin",
							"value": "*"
						},
						{
							"key": "Content-Type",
							"value": "application/json; charset=utf-8"
						},
						{
							"key": "Content-Length",
							"value": "454"
						},
						{
							"key": "ETag",
							"value": "W/\"1c6-7lqM61Mvl4Pc55pJGJHPUdkn1Sw\""
						},
						{
							"key": "Date",
							"value": "Tue, 28 Feb 2023 17:45:06 GMT"
						},
						{
							"key": "Connection",
							"value": "keep-alive"
						},
						{
							"key": "Keep-Alive",
							"value": "timeout=5"
						}
					],
					"cookie": [],
					"body": "{\n    \"success\": true,\n    \"message\": \"Uploaded Successfully\",\n    \"file\": {\n        \"fieldname\": \"file\",\n        \"originalname\": \"customerfileupload.xlsx\",\n        \"encoding\": \"7bit\",\n        \"mimetype\": \"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",\n        \"destination\": \"./uploads/2023/2/1/customer\",\n        \"filename\": \"1677606306894.xlsx\",\n        \"path\": \"uploads\\\\2023\\\\2\\\\1\\\\customer\\\\1677606306894.xlsx\",\n        \"size\": 9127\n    },\n    \"fileName\": \"1677606306894.xlsx\",\n    \"download\": \"/uploads/2023/2/1/customer/1677606306894.xlsx\"\n}"
				}
			]
		},
		{
			"name": "saveFileRecord",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "selectedshop",
						"value": "[\"1\"]",
						"type": "default"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\r\n    \"ID\": null,\r\n    \"originalname\":\"customerfileupload.xlsx\",\r\n    \"fileName\":\"1677606306894.xlsx\",\r\n    \"download\":\"/uploads/2023/2/1/customer/1677606306894.xlsx\",\r\n    \"path\":\"uploads\\\\2023\\\\2\\\\1\\\\customer\\\\1677606306894.xlsx\",\r\n    \"destination\":\"./uploads/2023/2/1/customer\",\r\n    \"Type\": \"Customer\"\r\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "localhost:3000/purchaseUpload/saveFileRecord",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"purchaseUpload",
						"saveFileRecord"
					]
				}
			},
			"response": [
				{
					"name": "saveFileRecord",
					"originalRequest": {
						"method": "POST",
						"header": [
							{
								"key": "selectedshop",
								"value": "[\"1\"]",
								"type": "default"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"ID\": null,\r\n    \"originalname\":\"customerfileupload.xlsx\",\r\n    \"fileName\":\"1677606306894.xlsx\",\r\n    \"download\":\"/uploads/2023/2/1/customer/1677606306894.xlsx\",\r\n    \"path\":\"uploads\\\\2023\\\\2\\\\1\\\\customer\\\\1677606306894.xlsx\",\r\n    \"destination\":\"./uploads/2023/2/1/customer\",\r\n    \"Type\": \"Customer\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "localhost:3000/purchaseUpload/saveFileRecord",
							"host": [
								"localhost"
							],
							"port": "3000",
							"path": [
								"purchaseUpload",
								"saveFileRecord"
							]
						}
					},
					"status": "OK",
					"code": 200,
					"_postman_previewlanguage": "json",
					"header": [
						{
							"key": "X-Powered-By",
							"value": "Express"
						},
						{
							"key": "Access-Control-Allow-Origin",
							"value": "*"
						},
						{
							"key": "Content-Type",
							"value": "application/json; charset=utf-8"
						},
						{
							"key": "Content-Length",
							"value": "60"
						},
						{
							"key": "ETag",
							"value": "W/\"3c-MvfnQdD1nLxJJqNLVlU1OoYldGc\""
						},
						{
							"key": "Date",
							"value": "Tue, 28 Feb 2023 17:48:01 GMT"
						},
						{
							"key": "Connection",
							"value": "keep-alive"
						},
						{
							"key": "Keep-Alive",
							"value": "timeout=5"
						}
					],
					"cookie": [],
					"body": "{\n    \"data\": [],\n    \"success\": true,\n    \"message\": \"data save sucessfully\"\n}"
				}
			]
		},
		{
			"name": "list",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "selectedshop",
						"value": "[\"1\"]",
						"type": "default"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\r\n    \"currentPage\": 1,\r\n   \"itemsPerPage\": 10 ,\r\n   \"Type\": \"Customer\"\r\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "localhost:3000/purchaseUpload/list",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"purchaseUpload",
						"list"
					]
				}
			},
			"response": [
				{
					"name": "list",
					"originalRequest": {
						"method": "POST",
						"header": [
							{
								"key": "selectedshop",
								"value": "[\"1\"]",
								"type": "default"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"currentPage\": 1,\r\n   \"itemsPerPage\": 10 ,\r\n   \"Type\": \"Customer\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "localhost:3000/purchaseUpload/list",
							"host": [
								"localhost"
							],
							"port": "3000",
							"path": [
								"purchaseUpload",
								"list"
							]
						}
					},
					"status": "OK",
					"code": 200,
					"_postman_previewlanguage": "json",
					"header": [
						{
							"key": "X-Powered-By",
							"value": "Express"
						},
						{
							"key": "Access-Control-Allow-Origin",
							"value": "*"
						},
						{
							"key": "Content-Type",
							"value": "application/json; charset=utf-8"
						},
						{
							"key": "Content-Length",
							"value": "507"
						},
						{
							"key": "ETag",
							"value": "W/\"1fb-I3xQs42NxwSsoTleN0SjXg/Mf1E\""
						},
						{
							"key": "Date",
							"value": "Tue, 28 Feb 2023 17:49:46 GMT"
						},
						{
							"key": "Connection",
							"value": "keep-alive"
						},
						{
							"key": "Keep-Alive",
							"value": "timeout=5"
						}
					],
					"cookie": [],
					"body": "{\n    \"data\": [\n        {\n            \"ID\": 13,\n            \"CompanyID\": 1,\n            \"ShopID\": 1,\n            \"originalname\": \"customerfileupload.xlsx\",\n            \"fileName\": \"1677606306894.xlsx\",\n            \"download\": \"/uploads/2023/2/1/customer/1677606306894.xlsx\",\n            \"path\": \"uploads202321customer1677606306894.xlsx\",\n            \"destination\": \"./uploads/2023/2/1/customer\",\n            \"Type\": \"Customer\",\n            \"Process\": 0,\n            \"PurchaseMaster\": 0,\n            \"UniqueBarcode\": 0,\n            \"Status\": 1,\n            \"CreatedOn\": \"2023-02-28 23:18:01\",\n            \"CreatedBy\": 2,\n            \"UpdatedOn\": \"0000-00-00 00:00:00\",\n            \"UpdatedBy\": null\n        }\n    ],\n    \"success\": true,\n    \"message\": \"data fetch sucessfully\",\n    \"count\": 1\n}"
				}
			]
		},
		{
			"name": "processCustomerFile",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "selectedshop",
						"value": "[\"1\"]",
						"type": "default"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\r\n    \"filename\": \"1677606306894.xlsx\",\r\n    \"originalname\":\"customerfileupload.xlsx\",\r\n    \"path\": \"uploads\\\\2023\\\\2\\\\1\\\\purchase\\\\1677606306894.xlsx\",\r\n    \"destination\": \"./uploads/2023/2/1/customer\"\r\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "localhost:3000/purchaseUpload/processCustomerFile",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"purchaseUpload",
						"processCustomerFile"
					]
				}
			},
			"response": [
				{
					"name": "processCustomerFile",
					"originalRequest": {
						"method": "POST",
						"header": [
							{
								"key": "selectedshop",
								"value": "[\"1\"]",
								"type": "default"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"filename\": \"1677606306894.xlsx\",\r\n    \"originalname\":\"customerfileupload.xlsx\",\r\n    \"path\": \"uploads\\\\2023\\\\2\\\\1\\\\purchase\\\\1677606306894.xlsx\",\r\n    \"destination\": \"./uploads/2023/2/1/customer\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "localhost:3000/purchaseUpload/processCustomerFile",
							"host": [
								"localhost"
							],
							"port": "3000",
							"path": [
								"purchaseUpload",
								"processCustomerFile"
							]
						}
					},
					"status": "OK",
					"code": 200,
					"_postman_previewlanguage": "json",
					"header": [
						{
							"key": "X-Powered-By",
							"value": "Express"
						},
						{
							"key": "Access-Control-Allow-Origin",
							"value": "*"
						},
						{
							"key": "Content-Type",
							"value": "application/json; charset=utf-8"
						},
						{
							"key": "Content-Length",
							"value": "60"
						},
						{
							"key": "ETag",
							"value": "W/\"3c-MvfnQdD1nLxJJqNLVlU1OoYldGc\""
						},
						{
							"key": "Date",
							"value": "Tue, 28 Feb 2023 18:27:21 GMT"
						},
						{
							"key": "Connection",
							"value": "keep-alive"
						},
						{
							"key": "Keep-Alive",
							"value": "timeout=5"
						}
					],
					"cookie": [],
					"body": "{\n    \"data\": [],\n    \"success\": true,\n    \"message\": \"data save sucessfully\"\n}"
				}
			]
		},
		{
			"name": "updateFileRecord",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "selectedshop",
						"value": "[\"1\"]",
						"type": "default"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\r\n    \"ID\": 13,\r\n    \"key\": \"Process\",\r\n    \"value\": 1,\r\n    \"Type\": \"Customer\"\r\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "localhost:3000/purchaseUpload/updateFileRecord",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"purchaseUpload",
						"updateFileRecord"
					]
				}
			},
			"response": [
				{
					"name": "updateFileRecord",
					"originalRequest": {
						"method": "POST",
						"header": [
							{
								"key": "selectedshop",
								"value": "[\"1\"]",
								"type": "default"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"ID\": 13,\r\n    \"key\": \"Process\",\r\n    \"value\": 1,\r\n    \"Type\": \"Customer\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "localhost:3000/purchaseUpload/updateFileRecord",
							"host": [
								"localhost"
							],
							"port": "3000",
							"path": [
								"purchaseUpload",
								"updateFileRecord"
							]
						}
					},
					"status": "OK",
					"code": 200,
					"_postman_previewlanguage": "json",
					"header": [
						{
							"key": "X-Powered-By",
							"value": "Express"
						},
						{
							"key": "Access-Control-Allow-Origin",
							"value": "*"
						},
						{
							"key": "Content-Type",
							"value": "application/json; charset=utf-8"
						},
						{
							"key": "Content-Length",
							"value": "62"
						},
						{
							"key": "ETag",
							"value": "W/\"3e-Vv0gYUQyqsowM8075j7LbumrJAI\""
						},
						{
							"key": "Date",
							"value": "Tue, 28 Feb 2023 18:29:10 GMT"
						},
						{
							"key": "Connection",
							"value": "keep-alive"
						},
						{
							"key": "Keep-Alive",
							"value": "timeout=5"
						}
					],
					"cookie": [],
					"body": "{\n    \"data\": [],\n    \"success\": true,\n    \"message\": \"data update sucessfully\"\n}"
				}
			]
		}
	],
	"auth": {
		"type": "bearer",
		"bearer": [
			{
				"key": "token",
				"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2Nzc2MDU4ODcsImV4cCI6MTY3NzY5MjI4NywiYXVkIjoiJzInIiwiaXNzIjoicGlja3VycGFnZS5jb20ifQ.2eQjkYWynzU7jSRhlfeyyIXG1zkP2QB7MtQPXJGpwSg",
				"type": "string"
			}
		]
	},
	"event": [
		{
			"listen": "prerequest",
			"script": {
				"type": "text/javascript",
				"exec": [
					""
				]
			}
		},
		{
			"listen": "test",
			"script": {
				"type": "text/javascript",
				"exec": [
					""
				]
			}
		}
	]
}