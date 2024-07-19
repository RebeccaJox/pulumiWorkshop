import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("my-bucket", {
  website: {
    indexDocument: "index.html",
  },
});

const ownershipControls = new aws.s3.BucketOwnershipControls(
  "ownership-controls",
  {
    bucket: bucket.id,
    rule: {
      objectOwnership: "ObjectWriter",
    },
  }
);

// bucket may be accessed publicly
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "public-access-block",
  {
    bucket: bucket.id,
    blockPublicAcls: false,
  }
);

// Create an S3 Bucket object
const bucketObject = new aws.s3.BucketObject(
  "index.html",
  {
    bucket: bucket.id,
    source: new pulumi.asset.FileAsset("./index.html"),
    contentType: "text/html", // serve the file as a web page
    acl: "public-read", // anonymus public-read for the bucket to access the website from the web
  },
  { dependsOn: [publicAccessBlock, ownershipControls] }
);

// Export the name of the bucket
export const bucketName = bucket.id;

// export the buckets Url to access the website
export const bucketEndpoint = pulumi.interpolate`http://${bucket.websiteEndpoint}`;
