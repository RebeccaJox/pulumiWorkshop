// import * as aws from "@pulumi/aws";
// import * as pulumi from "@pulumi/pulumi";

// // Create an AWS resource (S3 Bucket)
// // Parent Object
// const bucket = new aws.s3.Bucket("my-bucket", {
//   website: {
//     indexDocument: "index.html",
//   },
// });

// const ownershipControls = new aws.s3.BucketOwnershipControls(
//   "ownership-controls",
//   {
//     bucket: bucket.id,
//     rule: {
//       objectOwnership: "ObjectWriter",
//     },
//   }
// );

// // bucket may be accessed publically
// const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
//   "public-access-block",
//   {
//     bucket: bucket.id,
//     blockPublicAcls: false,
//   }
// );

// // Create an S3 Bucket object
// // Child Object
// const bucketObject = new aws.s3.BucketObject(
//   "index.html",
//   {
//     bucket: bucket.id,
//     source: new pulumi.asset.FileAsset("./index.html"),
//     contentType: "text/html", // serve the file as a web page
//     acl: "public-read", // anonymus public-read for the bucket to access the website from the web
//   },
//   { dependsOn: [publicAccessBlock, ownershipControls] }
// );

// // Export the name of the bucket
// export const bucketName = bucket.id;

// // export the buckets Url to access the website
// export const bucketEndpoint = pulumi.interpolate`http://${bucket.websiteEndpoint}`;
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const bucket = new aws.s3.BucketV2("nextjs-bucket");

const ownershipControls = new aws.s3.BucketOwnershipControls(
  "ownership-controls",
  {
    bucket: bucket.id,
    rule: {
      objectOwnership: "ObjectWriter",
    },
  }
);

// bucket may be accessed publically
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "public-access-block",
  {
    bucket: bucket.id,
    blockPublicAcls: false,
  }
);

// const acl = new aws.s3.BucketAclV2("acl", {
//   bucket: bucket.id,
//   acl: "private",
// });

const siteDir = "../my-app/out.zip";
const siteBucketObject = new aws.s3.BucketObjectv2("nextjs-bucket-object", {
  bucket: bucket.id,
  source: new pulumi.asset.FileArchive(siteDir),
  key: "index.html",
});

const s3OriginId = "myS3Origin";

// Wire up the static website bucket with a CDN
const s3Distribution = new aws.cloudfront.Distribution("s3_distribution", {
  origins: [
    {
      domainName: bucket.bucketRegionalDomainName,
      originId: s3OriginId,
    },
  ],
  enabled: true,
  defaultRootObject: "index.html",
  defaultCacheBehavior: {
    allowedMethods: [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT",
    ],
    cachedMethods: ["GET", "HEAD"],
    targetOriginId: s3OriginId,
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none",
      },
    },
    viewerProtocolPolicy: "allow-all",
    minTtl: 0,
    defaultTtl: 3600,
    maxTtl: 86400,
  },
  restrictions: {
    geoRestriction: {
      restrictionType: "whitelist",
      locations: ["US", "CA", "GB", "DE"],
    },
  },
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
});

// Export the website URL
export const websiteUrl = pulumi.interpolate`http://${s3Distribution.domainName}`;

// Export the CloudFront URL
export const cdnUrl = s3Distribution.domainName.apply((n) => `https://${n}`);
