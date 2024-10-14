// This example runs locally in docker and is only to demonstrate usage of secretes and parameters

import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";

// Get configuration values
const config = new pulumi.Config();
const frontendPort = config.requireNumber("frontendPort");
const backendPort = config.requireNumber("backendPort");
const mongoPort = config.requireNumber("mongoPort");
const mongoHost = config.require("mongoHost");
const database = config.require("database");
const nodeEnvironment = config.require("nodeEnvironment");
const protocol = config.require("protocol");
const mongoUsername = config.require("mongoUsername");
const mongoPassword = config.requireSecret("mongoPassword");

const stack = pulumi.getStack();

// Pull the backend image
const backendImageName = "backend";
const backend = new docker.RemoteImage(`${backendImageName}Image`, {
  name: "pulumi/tutorial-pulumi-fundamentals-backend:latest",
});

// Pull the frontend image
const frontendImageName = "frontend";
const frontend = new docker.RemoteImage(`${frontendImageName}Image`, {
  name: "pulumi/tutorial-pulumi-fundamentals-frontend:latest",
});

// Pull the MongoDB image
const mongoImage = new docker.RemoteImage("mongoImage", {
  name: "pulumi/tutorial-pulumi-fundamentals-database:latest",
});

// Create a Docker network
const network = new docker.Network("network", {
  name: `services-${stack}`,
});

// Create the MongoDB container
const mongoContainer = new docker.Container("mongoContainer", {
  image: mongoImage.repoDigest,
  name: `mongo-${stack}`,
  rm: true,
  ports: [
    {
      internal: mongoPort,
      external: mongoPort,
    },
  ],
  networksAdvanced: [
    {
      name: network.name,
      aliases: ["mongo"],
    },
  ],
  envs: [
    `MONGO_INITDB_ROOT_USERNAME=${mongoUsername}`,
    pulumi.interpolate`MONGO_INITDB_ROOT_PASSWORD=${mongoPassword}`,
  ],
});

// Create the backend container
const backendContainer = new docker.Container(
  "backendContainer",
  {
    name: `backend-${stack}`,
    image: backend.repoDigest,
    rm: true,
    ports: [
      {
        internal: backendPort,
        external: backendPort,
      },
    ],
    envs: [
      pulumi.interpolate`DATABASE_HOST=mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}`,
      `DATABASE_NAME=${database}?authSource=admin`,
      `NODE_ENV=${nodeEnvironment}`,
    ],
    networksAdvanced: [
      {
        name: network.name,
      },
    ],
  },
  { dependsOn: [mongoContainer] }
);

// Create the frontend container
const frontendContainer = new docker.Container("frontendContainer", {
  image: frontend.repoDigest,
  name: `frontend-${stack}`,
  rm: true,
  ports: [
    {
      internal: frontendPort,
      external: frontendPort,
    },
  ],
  envs: [
    `PORT=${frontendPort}`,
    `HTTP_PROXY=backend-${stack}:${backendPort}`,
    `PROXY_PROTOCOL=${protocol}`,
  ],
  networksAdvanced: [
    {
      name: network.name,
    },
  ],
});

export const url = pulumi.interpolate`http://localhost:${frontendPort}`;
export { mongoPassword };
