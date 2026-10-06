import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class ServerlessCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'StudentItemsTable', {
      tableName: 'StudentItems',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const itemsFunction = new lambdaNodejs.NodejsFunction(this, 'ItemsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.X86_64,
      entry: path.join(__dirname, '../lambda/items.ts'),
      handler: 'handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    table.grantReadWriteData(itemsFunction);

    const api = new apigateway.RestApi(this, 'StudentItemsApi');

    const integration = new apigateway.LambdaIntegration(itemsFunction);

    const items = api.root.addResource('items');

    items.addMethod('GET', integration);
    items.addMethod('POST', integration);

    const item = items.addResource('{id}');

    item.addMethod('GET', integration);
    item.addMethod('PUT', integration);
    item.addMethod('DELETE', integration);
  }
}