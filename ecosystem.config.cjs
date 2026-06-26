const fs = require("fs");
const path = require("path");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
  }
  return env;
}

const envVars = loadEnv(path.join(__dirname, ".env"));

module.exports = {
  apps: [
    {
      name: "web-app",
      cwd: "./packages/web",
      script: "src/server.ts",
      interpreter: "bun",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      restart_delay: 1000,
      env: {
        PORT: process.env.PORT || 4200,
        ...envVars,
      },
    },
  ],
};
