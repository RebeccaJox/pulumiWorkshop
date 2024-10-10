import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

// Mock reading credentials
jest.mock("@pulumi/aws", () => {
  const originalModule =
    jest.requireActual<typeof import("@pulumi/aws")>("@pulumi/aws");

  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => "mocked baz"),
    ecr: {
      ...originalModule.ecr,
      getCredentials: () => ({ authorizationToken: btoa("test:test") }),
    },
  };
});

describe("Infrastructure", function () {
  let infra: typeof import("./index");
  beforeAll(() => {
    // Put Pulumi in unit-test mode, mocking all calls to cloud-provider APIs.
    pulumi.runtime.setMocks({
      // Mock requests to provision cloud resources and return a canned response.
      newResource: (
        args: pulumi.runtime.MockResourceArgs
      ): { id: string; state: any } => {
        return {
          id: `${args.name}-id`,
          state: args.inputs,
        };
      },
      // Mock function calls and return whatever input properties were provided.
      call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
      },
    });
  });
  beforeEach(async () => {
    // It's important to import the program _after_ the mocks are defined.
    infra = await import("./index");
  });

  describe("validate resources", () => {
    it("image has the platform linux/amd64 defined", (done) => {
      infra.image.build.apply((build) => {
        try {
          expect(build).toBeDefined();
          expect(build).toEqual({
            context: "app",
            platform: "linux/amd64",
          });
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it("the lambda permission is set to  lambda:InvokeFunction", (done) => {
      infra.lambdaPermission.action.apply((action) => {
        try {
          expect(action).toBeDefined();
          expect(action).toEqual("lambda:InvokeFunction");
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});
