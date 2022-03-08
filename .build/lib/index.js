var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, copyDefault, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toESM = (module2, isNodeMode) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", !isNodeMode && module2 && module2.__esModule ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __toCommonJS = /* @__PURE__ */ ((cache) => {
  return (module2, temp) => {
    return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
  };
})(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);

// stacks/index.js
var stacks_exports = {};
__export(stacks_exports, {
  default: () => main
});

// stacks/ApiStack.js
var sst = __toESM(require("@serverless-stack/resources"));
var ApiStack = class extends sst.Stack {
  api;
  constructor(scope, id, props) {
    super(scope, id, props);
    const { table } = props;
    this.api = new sst.Api(this, "Api", {
      defaultAuthorizationType: "AWS_IAM",
      defaultFunctionProps: {
        environment: {
          TABLE_NAME: table.tableName,
          STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
        }
      },
      routes: {
        "POST   /notes": "src/create.main",
        "GET    /notes/{id}": "src/get.main",
        "GET    /notes": "src/list.main",
        "PUT    /notes/{id}": "src/update.main",
        "DELETE /notes/{id}": "src/delete.main",
        "POST   /billing": "src/billing.main"
      }
    });
    this.api.attachPermissions([table]);
    this.addOutputs({
      ApiEndpoint: this.api.url
    });
  }
};
__name(ApiStack, "ApiStack");

// stacks/StorageStack.js
var sst2 = __toESM(require("@serverless-stack/resources"));
var StorageStack = class extends sst2.Stack {
  bucket;
  table;
  constructor(scope, id, props) {
    super(scope, id, props);
    this.bucket = new sst2.Bucket(this, "Uploads");
    this.table = new sst2.Table(this, "Notes", {
      fields: {
        userId: sst2.TableFieldType.STRING,
        noteId: sst2.TableFieldType.STRING
      },
      primaryIndex: { partitionKey: "userId", sortKey: "noteId" }
    });
  }
};
__name(StorageStack, "StorageStack");

// stacks/AuthStack.js
var iam = __toESM(require("aws-cdk-lib/aws-iam"));
var sst3 = __toESM(require("@serverless-stack/resources"));
var AuthStack = class extends sst3.Stack {
  auth;
  constructor(scope, id, props) {
    super(scope, id, props);
    const { api, bucket } = props;
    this.auth = new sst3.Auth(this, "Auth", {
      cognito: {
        userPool: {
          signInAliases: { email: true }
        }
      }
    });
    this.auth.attachPermissionsForAuthUsers([
      api,
      new iam.PolicyStatement({
        actions: ["s3:*"],
        effect: iam.Effect.ALLOW,
        resources: [
          bucket.bucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*"
        ]
      })
    ]);
    this.addOutputs({
      Region: scope.region,
      UserPoolId: this.auth.cognitoUserPool.userPoolId,
      IdentityPoolId: this.auth.cognitoCfnIdentityPool.ref,
      UserPoolClientId: this.auth.cognitoUserPoolClient.userPoolClientId
    });
  }
};
__name(AuthStack, "AuthStack");

// stacks/index.js
function main(app) {
  const storageStack = new StorageStack(app, "storage");
  const apiStack = new ApiStack(app, "api", {
    table: storageStack.table
  });
  new AuthStack(app, "auth", {
    api: apiStack.api,
    bucket: storageStack.bucket
  });
}
__name(main, "main");
module.exports = __toCommonJS(stacks_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=index.js.map
