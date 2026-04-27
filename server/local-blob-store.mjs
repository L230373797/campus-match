import fs from "node:fs/promises";
import path from "node:path";

const PAGE_SIZE = 100;

export function createLocalBlobStore(rootDir) {
  return {
    async get(key, options = {}) {
      try {
        const filePath = resolveKey(rootDir, key);
        const buffer = await fs.readFile(filePath);

        if (options.type === "json") {
          return JSON.parse(buffer.toString("utf8"));
        }

        if (options.type === "arrayBuffer") {
          return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }

        return buffer;
      } catch (error) {
        if (error?.code === "ENOENT") {
          return null;
        }
        throw error;
      }
    },

    async set(key, value) {
      const filePath = resolveKey(rootDir, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, toBuffer(value));
    },

    async setJSON(key, value) {
      const filePath = resolveKey(rootDir, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(value));
    },

    async delete(key) {
      const filePath = resolveKey(rootDir, key);
      await fs.rm(filePath, { force: true });
    },

    async list({ prefix = "", cursor } = {}) {
      const allKeys = [];
      await collectKeys(rootDir, "", allKeys);
      const filtered = allKeys.filter((key) => key.startsWith(prefix)).sort();
      const offset = decodeCursor(cursor);
      const page = filtered.slice(offset, offset + PAGE_SIZE);
      const nextCursor = offset + PAGE_SIZE < filtered.length
        ? Buffer.from(String(offset + PAGE_SIZE), "utf8").toString("base64url")
        : null;

      return {
        blobs: page.map((key) => ({ key })),
        cursor: nextCursor,
      };
    },
  };
}

async function collectKeys(rootDir, relativeDir, output) {
  const dirPath = path.join(rootDir, relativeDir);
  let entries = [];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    const nextRelative = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      await collectKeys(rootDir, nextRelative, output);
    } else if (entry.isFile()) {
      output.push(nextRelative.replace(/\\/g, "/"));
    }
  }
}

function resolveKey(rootDir, key) {
  const safeKey = String(key || "").replace(/^\/+/, "");
  const resolved = path.resolve(rootDir, safeKey);
  const normalizedRoot = path.resolve(rootDir);
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error(`Blob key escapes store root: ${key}`);
  }
  return resolved;
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }

  return Buffer.from(String(value));
}

function decodeCursor(cursor) {
  if (!cursor) {
    return 0;
  }

  const offset = Number.parseInt(Buffer.from(String(cursor), "base64url").toString("utf8"), 10);
  return Number.isFinite(offset) && offset >= 0 ? offset : 0;
}
