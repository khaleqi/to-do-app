import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import path = require("path");

export class BackendStack extends cdk.Stack {
  private readonly ddbTable: ddb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const API_LAMBDA_PREFIX = "lambda";
    const GET_LAMBDA_TODO_LOCATION = `${API_LAMBDA_PREFIX}/getTodo/`;
    const PUT_LAMBDA_TODO_LOCATION = `${API_LAMBDA_PREFIX}/putTodo/`;
    const POST_LAMBDA_TODO_LOCATION = `${API_LAMBDA_PREFIX}/postTodo/`;
    const DELETE_LAMBDA_TODO_LOCATION = `${API_LAMBDA_PREFIX}/deleteTodo/`;

    // create DynamoDB table
    this.ddbTable = this.createDynamoDbTable(
      "toDo-table",
      "pk",
      ddb.AttributeType.STRING
    );

    // api gateway
    // const api = new apigateway.RestApi(this, "todos-api", {
    //   defaultCorsPreflightOptions: {
    //     allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
    //     allowMethods: apigateway.Cors.ALL_METHODS, // Allow all methods
    //     allowHeaders: [
    //       "Content-Type",
    //       "X-Amz-Date",
    //       "Authorization",
    //       "X-Api-Key",
    //     ], // Add any additional required headers
    //   }
    // });
    const api = new apigateway.RestApi(this, "todos-api");

    const todos = api.root.addResource("todos");

    // create lambda functions
    const getTodosHandler = this.createLambda(
      "get-todos",
      GET_LAMBDA_TODO_LOCATION
    );
    // const postTodoHandler = this.createLambda("post-todo", POST_LAMBDA_TODO_LOCATION);
    const putTodoHandler = this.createLambda(
      "put-todo",
      PUT_LAMBDA_TODO_LOCATION
    );
    const deleteTodoHandler = this.createLambda(
      "delete-todo",
      DELETE_LAMBDA_TODO_LOCATION
    );

    // GET /toDos
    todos.addMethod("GET", new apigateway.LambdaIntegration(getTodosHandler));
    // POST /toDos
    // todos.addMethod("POST", new apigateway.LambdaIntegration(postTodoHandler));
    // PUT /toDos
    todos.addMethod("PUT", new apigateway.LambdaIntegration(putTodoHandler));
    // DELETE /toDos
    todos.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteTodoHandler, {
        requestParameters: {
          "method.request.path.itemId": "true",
        },
      })
    );
    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: api.url,
    });
  }

  createApiGateway(
    getTodosHandler: cdk.aws_lambda.Function,
    postTodoHandler: cdk.aws_lambda.Function,
    putTodoHandler: cdk.aws_lambda.Function,
    deleteTodoHandler: cdk.aws_lambda.Function
  ) {
    const api = new apigateway.RestApi(this, "todos-api");
    const resource = api.root.addResource("todos");
    // GET /toDos
    resource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getTodosHandler)
    );
    // POST /toDos
    // resource.addMethod("POST", new apigateway.LambdaIntegration(postTodoHandler));
    // PUT /toDos
    resource.addMethod("PUT", new apigateway.LambdaIntegration(putTodoHandler));
    // DELETE /toDos
    resource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteTodoHandler, {
        requestParameters: {
          "method.request.path.itemId": "true",
        },
      })
    );
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

  createLambda(name: string, codeLocation: string): cdk.aws_lambda.Function {
    const lambdaFn = new lambda.Function(this, name, {
      functionName: name,
      handler: "index.handler",
      code: lambda.Code.fromAsset(codeLocation),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE: this.ddbTable.tableName,
      },
    });
    new logs.LogGroup(this, `${name}-log-group`, {
      logGroupName: `/aws/lambda/${lambdaFn.functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_MONTH,
    });
    this.ddbTable.grantFullAccess(lambdaFn);
    return lambdaFn;
  }
}
