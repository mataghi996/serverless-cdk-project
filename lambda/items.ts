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
const db = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  try {
    const method = event.httpMethod;
    const id = event.pathParameters?.id;

    // POST /items
    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");

      if (!body.id || !body.name) {
        return response(400, { message: "id and name are required" });
      }

      const item = {
        id: body.id,
        name: body.name,
        description: body.description || "",
        category: body.category || ""
      };

      await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));

      return response(201, {
        message: "Item created successfully",
        item
      });
    }

    // GET /items
    if (method === "GET" && !id) {
      const result = await db.send(new ScanCommand({
        TableName: TABLE_NAME
      }));

      return response(200, result.Items || []);
    }

    // GET /items/{id}
    if (method === "GET" && id) {
      const result = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id }
      }));

      if (!result.Item) {
        return response(404, { message: "Item not found" });
      }

      return response(200, result.Item);
    }

    // PUT /items/{id}
    if (method === "PUT" && id) {
      const body = JSON.parse(event.body || "{}");

      const result = await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: "SET #n = :name, description = :description, category = :category",
        ExpressionAttributeNames: {
          "#n": "name"
        },
        ExpressionAttributeValues: {
          ":name": body.name || "",
          ":description": body.description || "",
          ":category": body.category || ""
        },
        ReturnValues: "ALL_NEW"
      }));

      return response(200, {
        message: "Item updated successfully",
        item: result.Attributes
      });
    }

    // DELETE /items/{id}
    if (method === "DELETE" && id) {
      await db.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id }
      }));

      return response(200, {
        message: "Item deleted successfully"
      });
    }

    return response(400, { message: "Invalid request" });

  } catch (error) {
    console.error(error);
    return response(500, { message: "Internal Server Error" });
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