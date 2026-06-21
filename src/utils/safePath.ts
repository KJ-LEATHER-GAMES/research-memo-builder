import path from "node:path";

export class UnsafePathError extends Error {
  constructor(
    public readonly label: string,
    public readonly value: string,
    message: string,
  ) {
    super(`${label} is invalid: ${message}`);
    this.name = "UnsafePathError";
  }
}

export function isSafeRelativePath(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.includes("\0")) {
    return false;
  }

  if (path.isAbsolute(trimmed)) {
    return false;
  }

  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return false;
  }

  const normalized = trimmed.replace(/\\/g, "/");

  if (normalized === "..") {
    return false;
  }

  if (normalized.startsWith("../")) {
    return false;
  }

  if (normalized.includes("/../")) {
    return false;
  }

  if (normalized.endsWith("/..")) {
    return false;
  }

  return true;
}

export function assertSafeRelativePath(value: string, label = "path"): string {
  const trimmed = value.trim();

  if (!isSafeRelativePath(trimmed)) {
    throw new UnsafePathError(
      label,
      value,
      "use a relative path without absolute path notation or '../'",
    );
  }

  return trimmed;
}
