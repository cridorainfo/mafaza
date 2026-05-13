#!/usr/bin/env node

require("dotenv/config");

const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const { User } = require("../app/Models");

const MIN_PASSWORD_LENGTH = 6;

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;

    const [rawKey, inlineValue] = token.slice(2).split("=");
    const key = rawKey.trim();

    if (!key) continue;
    if (typeof inlineValue !== "undefined") {
      args[key] = inlineValue.trim();
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next.trim();
      i += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH;
}

async function promptForMissingFields(fields) {
  const rl = readline.createInterface({ input, output });
  try {
    if (!fields.name) {
      fields.name = (await rl.question("Admin name: ")).trim();
    }

    while (!fields.email || !isValidEmail(fields.email)) {
      const emailInput = fields.email || (await rl.question("Admin email: "));
      fields.email = normalizeEmail(emailInput);
      if (!isValidEmail(fields.email)) {
        output.write("Please enter a valid email address.\n");
      }
    }

    while (!isValidPassword(fields.password)) {
      const passwordInput =
        fields.password || (await rl.question("Admin password (min 6 chars): "));
      fields.password = String(passwordInput || "");
      if (!isValidPassword(fields.password)) {
        output.write("Password must be at least 6 characters.\n");
      }
    }
  } finally {
    rl.close();
  }

  return fields;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  const fields = {
    name: String(args.name || "").trim(),
    email: normalizeEmail(args.email),
    password: typeof args.password === "string" ? args.password : "",
  };

  await promptForMissingFields(fields);
  await User.sequelize.sync();

  const passwordHash = await bcrypt.hash(fields.password, 10);
  const existingUser = await User.scope("withHash").findOne({
    where: { email: fields.email },
  });

  if (existingUser) {
    existingUser.name = fields.name || existingUser.name;
    existingUser.password = passwordHash;
    existingUser.role = "admin";
    existingUser.status = "verified";
    await existingUser.save();

    output.write(
      `Updated existing user as verified admin: ${existingUser.email}\n`
    );
    return;
  }

  await User.create({
    name: fields.name,
    email: fields.email,
    password: passwordHash,
    role: "admin",
    status: "verified",
  });

  output.write(`Created verified admin user: ${fields.email}\n`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    output.write(`Failed to create admin user: ${error?.message || error}\n`);
    process.exit(1);
  });
