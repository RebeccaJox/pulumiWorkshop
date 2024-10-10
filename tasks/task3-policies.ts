import * as aws from "@pulumi/aws";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

new PolicyPack("aws-typescript", {
  policies: [
    {
      name: "lambdas name must start with pulumi",
      description: "A 'Name' tag is required.",
      enforcementLevel: "mandatory",
      validateResource: [
        validateResourceOfType(
          aws.lambda.Function,
          (resource, args, reportViolation) => {
            if (!resource?.name?.startsWith("pulumi")) {
              reportViolation("All names must start with pulumi");
            }
          }
        ),
      ],
    },
    {
      name: "lambdas must have a description",
      description: "A 'Name' tag is required.",
      enforcementLevel: "mandatory",
      validateResource: [
        validateResourceOfType(
          aws.lambda.Function,
          (resource, args, reportViolation) => {
            if (resource?.description === undefined) {
              reportViolation("Lambdas must have a description");
            }
          }
        ),
      ],
    },
  ],
});
