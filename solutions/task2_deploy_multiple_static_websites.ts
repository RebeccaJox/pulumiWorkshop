import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

function createMultipleStaticWebsites(bucketName: string) {
  // Create an AWS resource (S3 Bucket)
  const bucket = new aws.s3.Bucket(bucketName, {
    website: {
      indexDocument: "index.html",
    },
  });

  const ownershipControls = new aws.s3.BucketOwnershipControls(
    `${bucketName}-ownership-controls`,
    {
      bucket: bucket.id,
      rule: {
        objectOwnership: "ObjectWriter",
      },
    }
  );

  // bucket may be accessed publicly
  const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
    `${bucketName}-public-access-block`,
    {
      bucket: bucket.id,
      blockPublicAcls: false,
    }
  );

  // Create an S3 Bucket object
  const bucketObject = new aws.s3.BucketObject(
    `${bucketName}-index.html`,
    {
      bucket: bucket.id,
      source: new pulumi.asset.FileAsset("./index.html"),
      contentType: "text/html", // serve the file as a web page
      acl: "public-read", // anonymus public-read for the bucket to access the website from the web
    },
    { dependsOn: [publicAccessBlock, ownershipControls] }
  );
  return bucket;
}

const bucketsDescription = ["bucketA", "bucketB", "bucketC"];
const buckets = bucketsDescription.map((bucket) =>
  createMultipleStaticWebsites(bucket)
);

// Export the name of the bucket
export const bucketNames = buckets.map((bucket) => bucket.id);

// export the buckets Url to access the website
export const bucketEndpointA = pulumi.interpolate`http://${buckets[0].websiteEndpoint}/${bucketsDescription[0]}-index.html`;
export const bucketEndpointB = pulumi.interpolate`http://${buckets[1].websiteEndpoint}/${bucketsDescription[1]}-index.html`;
export const bucketEndpointC = pulumi.interpolate`http://${buckets[2].websiteEndpoint}/${bucketsDescription[2]}-index.html`;
