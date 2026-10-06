import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: any) => {

  console.log("Event:", JSON.stringify(event));

  try {

    const method = event.httpMethod;
    const id = event.pathParameters?.id;

    // POST /items
    if (method === "POST") {

      const body = JSON.parse(event.body || "{}");

      if (!body.id || !body.name) {
        return response(400, {
          message: "id and name are required"
        });
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

      return response(201, {
        message: "Item created successfully",
        item
      });
    }

    // GET /items
    if (method === "GET" && !id) {

      const result = await dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME
        })
      );

      return response(200, result.Items || []);
    }

    // GET /items/{id}
    if (method === "GET" && id) {

      const result = await dynamodb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { id }
        })
      );

      if (!result.Item) {
        return response(404, {
          message: "Item not found"
        });
      }

      return response(200, result.Item);
    }

    // PUT /items/{id}
    if (method === "PUT" && id) {

      const body = JSON.parse(event.body || "{}");

      const result = await dynamodb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,

          Key: { id },

          UpdateExpression:
            "SET #name = :name, description = :description, category = :category",

          ExpressionAttributeNames: {
            "#name": "name"
          },

          ExpressionAttributeValues: {
            ":name": body.name || "",
            ":description": body.description || "",
            ":category": body.category || ""
          },

          ReturnValues: "ALL_NEW"
        })
      );

      return response(200, {
        message: "Item updated successfully",
        item: result.Attributes
      });
    }

    // DELETE /items/{id}
    if (method === "DELETE" && id) {

      await dynamodb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id }
        })
      );

      return response(200, {
        message: "Item deleted successfully"
      });
    }

    return response(400, {
      message: "Unsupported request"
    });

  } catch (error) {

    console.error("ERROR:", error);

    return response(500, {
      message: "Internal Server Error"
    });
  }
};

function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}