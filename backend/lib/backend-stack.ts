import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import path = require("path");

export class BackendStack extends cdk.Stack {
  private readonly ddbTable: ddb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const API_LAMBDA_PREFIX = "../api";
    const LAMBDA_GET_TODO_LOCATION = `${API_LAMBDA_PREFIX}/getTodo/index.js`;
    const LAMBDA_PUT_TODO_LOCATION = `${API_LAMBDA_PREFIX}/putTodo/index.js`;
    const LAMBDA_POST_TODO_LOCATION = `${API_LAMBDA_PREFIX}/postTodo/index.js`;
    const LAMBDA_DELETE_TODO_LOCATION = `${API_LAMBDA_PREFIX}/deleteTodo/index.js`;

    // create DynamoDB table
    this.ddbTable = this.createDynamoDbTable(
      "toDo",
      "id",
      ddb.AttributeType.STRING
    );

    // api gateway
    const api = new apigateway.RestApi(this, "todos-api");
    const employees = api.root.addResource("todos");

    // create lambda functions
    const getTodosHandler = this.createLambda("get-todos", LAMBDA_GET_TODO_LOCATION);
    // const postTodoHandler = this.createLambda("post-todo", LAMBDA_POST_TODO_LOCATION);
    // const putTodoHandler = this.createLambda("put-todo", LAMBDA_PUT_TODO_LOCATION);
    // const deleteTodoHandler = this.createLambda("delete-todo", LAMBDA_DELETE_TODO_LOCATION);

    // GET /toDos
    employees.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getTodosHandler)
    );
    // // POST /toDos
    // employees.addMethod("POST", new apigateway.LambdaIntegration(postTodoHandler));
    // // PUT /toDos
    // employees.addMethod("PUT", new apigateway.LambdaIntegration(putTodoHandler));
    // // DELETE /toDos
    // employees.addMethod("DELETE", new apigateway.LambdaIntegration(deleteTodoHandler));

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: api.url,
    });
  }

  createDynamoDbTable(
    tableName: string,
    partitionKeyName: string,
    partitionKeyType: ddb.AttributeType
  ) {
    return new ddb.Table(this, tableName, {
      tableName: tableName,
      billingMode: ddb.BillingMode.PROVISIONED,
      partitionKey: {
        name: partitionKeyName,
        type: partitionKeyType,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  createLambda(name: string, entry: string): cdk.aws_lambda.Function {
    const functionName = name + "Handler";
    const lambdaFn = new lambda.Function(this, name, {
      functionName: functionName,
      handler: "index.handler",
      code: lambda.Code.fromAsset('lambda'),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE: this.ddbTable.tableName,
      }
    });
    new logs.LogGroup(this, `${name}-log-group`, {
      logGroupName: `/aws/lambda/${lambdaFn.functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_MONTH,
    })
    this.ddbTable.grantFullAccess(lambdaFn);
    return lambdaFn
  }
}
