import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: any) => {

  try {

    const method = event.httpMethod;
    const id = event.pathParameters?.id;

    if (method === "POST") {

      const body = JSON.parse(event.body || "{}");

      if (!body.id || !body.name) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "id and name are required"
          })
        };
      }

      const item = {
        id: body.id,
        name: body.name,
        description: body.description || "",
        category: body.category || ""
      };

      await dynamodb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item
        })
      );

      return {
        statusCode: 201,
        body: JSON.stringify({
          message: "Item created successfully",
          item
        })
      };
    }

    if (method === "GET" && !id) {

      const result = await dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.Items)
      };
    }

    if (method === "GET" && id) {

      const result = await dynamodb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            id: id
          }
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.Item)
      };
    }

    if (method === "PUT" && id) {

      const body = JSON.parse(event.body || "{}");

      const item = {
        id: id,
        name: body.name,
        description: body.description || "",
        category: body.category || ""
      };

      await dynamodb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Item updated successfully",
          item
        })
      };
    }

    if (method === "DELETE" && id) {

      await dynamodb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            id: id
          }
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Item deleted successfully"
        })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid request"
      })
    };

  } catch (error) {

    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error"
      })
    };
  }
};