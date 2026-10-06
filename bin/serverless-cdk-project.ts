#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import { ServerlessCdkProjectStack } from '../lib/serverless-cdk-project-stack';

const app = new cdk.App();

new ServerlessCdkProjectStack(app, 'ServerlessCdkProjectStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ca-central-1'
  }
});