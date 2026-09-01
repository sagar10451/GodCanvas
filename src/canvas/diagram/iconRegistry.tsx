/**
 * Icon registry — maps string IDs to AWS icon React components.
 * String IDs are what get serialized to JSON. At render time we resolve them
 * to actual components via getIconComponent().
 *
 * Uses @aws-icons/react for AWS architecture icons.
 */

import type { ComponentType, SVGProps } from 'react';
import {
  AmazonEc2,
  AmazonSimpleStorageService,
  AmazonDynamoDb,
  AmazonRds,
  AmazonElastiCache,
  AwsLambda,
  AmazonApiGateway,
  AmazonCloudFront,
  AmazonRoute53,
  AmazonSimpleQueueService,
  AmazonSimpleNotificationService,
  AmazonKinesis,
  AmazonCognito,
  AmazonRedshift,
  AwsFargate,
  AwsStepFunctions,
  ElasticLoadBalancing,
  AmazonBedrock,
  AmazonVpcLattice,
} from '@aws-icons/react/architecture-service';

import {
  Compute,
  Containers,
  Databases,
  Storage,
  Serverless,
  NetworkingContentDelivery,
  SecurityIdentity,
  Analytics,
  ApplicationIntegration,
  ManagementTools,
} from '@aws-icons/react/category';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// ─── Registry ────────────────────────────────────────────────────────────────

const ICON_REGISTRY: Record<string, IconComponent> = {
  // AWS Service Icons
  EC2: AmazonEc2 as IconComponent,
  S3: AmazonSimpleStorageService as IconComponent,
  DynamoDB: AmazonDynamoDb as IconComponent,
  RDS: AmazonRds as IconComponent,
  ElastiCache: AmazonElastiCache as IconComponent,
  Lambda: AwsLambda as IconComponent,
  APIGateway: AmazonApiGateway as IconComponent,
  CloudFront: AmazonCloudFront as IconComponent,
  Route53: AmazonRoute53 as IconComponent,
  SQS: AmazonSimpleQueueService as IconComponent,
  SNS: AmazonSimpleNotificationService as IconComponent,
  Kinesis: AmazonKinesis as IconComponent,
  Cognito: AmazonCognito as IconComponent,
  Redshift: AmazonRedshift as IconComponent,
  Fargate: AwsFargate as IconComponent,
  StepFunctions: AwsStepFunctions as IconComponent,
  ELB: ElasticLoadBalancing as IconComponent,
  Bedrock: AmazonBedrock as IconComponent,
  VPCLattice: AmazonVpcLattice as IconComponent,

  // AWS Category Icons
  Compute: Compute as IconComponent,
  Containers: Containers as IconComponent,
  Database: Databases as IconComponent,
  Storage: Storage as IconComponent,
  Serverless: Serverless as IconComponent,
  Networking: NetworkingContentDelivery as IconComponent,
  Security: SecurityIdentity as IconComponent,
  Analytics: Analytics as IconComponent,
  Integration: ApplicationIntegration as IconComponent,
  Management: ManagementTools as IconComponent,
};

/**
 * Get the icon React component for a given string ID.
 * Returns null if not found (caller should fallback to emoji/text).
 */
export function getIconComponent(iconId: string): IconComponent | null {
  return ICON_REGISTRY[iconId] || null;
}

export function getAllIconIds(): string[] {
  return Object.keys(ICON_REGISTRY);
}

export { ICON_REGISTRY };
