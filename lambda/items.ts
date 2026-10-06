import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";


// Connect to DynamoDB
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);


// Get table name
const TABLE_NAME = process.env.TABLE_NAME!;


// Lambda function
export const handler = async (event: any) => {

  const method = event.httpMethod;
  const id = event.pathParameters?.id;


  // POST /items
  if (method === "POST") {

    const item = JSON.parse(event.body);

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    });

    await dynamodb.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify(item)
    };
  }


  // GET /items
  if (method === "GET" && !id) {

    const command = new ScanCommand({
      TableName: TABLE_NAME
    });

    const result = await dynamodb.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items)
    };
  }


  // GET /items/{id}
  if (method === "GET" && id) {

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        id: id
      }
    });

    const result = await dynamodb.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  }


  // PUT /items/{id}
  if (method === "PUT" && id) {

    const item = JSON.parse(event.body);

    const command = new UpdateCommand({
      TableName: TABLE_NAME,

      Key: {
        id: id
      },

      UpdateExpression:
        "SET #name = :name, description = :description, category = :category",

      ExpressionAttributeNames: {
        "#name": "name"
      },

      ExpressionAttributeValues: {
        ":name": item.name,
        ":description": item.description,
        ":category": item.category
      },

      ReturnValues: "ALL_NEW"
    });

    const result = await dynamodb.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  }


  // DELETE /items/{id}
  if (method === "DELETE" && id) {

    const command = new DeleteCommand({
      TableName: TABLE_NAME,

      Key: {
        id: id
      }
    });

    await dynamodb.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({})
    };
  }
    return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Invalid request"
    })
  };
};
