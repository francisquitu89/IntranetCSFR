import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Plain-text import for the temporary login flow.
// Usage:
//   node scripts/import_users.js usuarios.txt
// File formats supported:
//   Nombre\tEmail\tRol\tDepartamento\tTelefono
//   Nombre,Email,Rol,Departamento,Telefono
//   or a header row with those columns.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type ImportedUser = {
  nombre: string;
  email: string;
  rol: "admin" | "profesor" | "funcionario" | "director";
  departamento?: string | null;
  telefono?: string | null;
  password: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();
}

function buildPasswordFromName(nombre: string) {
  return `${normalizeText(nombre)}123`;
}

function splitLine(line: string) {
  if (line.includes("\t")) return line.split("\t").map((part) => part.trim());
  if (line.includes("|")) return line.split("|").map((part) => part.trim());
  return line.split(",").map((part) => part.trim());
}

function parseUsers(fileContent: string): ImportedUser[] {
  const lines = fileContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) return [];

  const firstParts = splitLine(lines[0]).map((part) => part.toLowerCase());
  const hasHeader = firstParts.includes("nombre") || firstParts.includes("email");
  const records = hasHeader ? lines.slice(1) : lines;

  const result: ImportedUser[] = [];

  for (const line of records) {
    const parts = splitLine(line);
    if (parts.length < 2) continue;

    const [nombre, email, rol, departamento, telefono, password] = parts;
    const safeRol = (rol || "funcionario") as ImportedUser["rol"];

    result.push({
      nombre,
      email,
      rol: ["admin", "profesor", "funcionario", "director"].includes(safeRol)
        ? safeRol
        : "funcionario",
      departamento: departamento || null,
      telefono: telefono || null,
      password: password || buildPasswordFromName(nombre),
    });
  }

  return result;
}

async function run(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const users = parseUsers(raw);

  if (users.length === 0) {
    console.log("No users found in file.");
    return;
  }

  for (const user of users) {
    const { error } = await supabase.from("usuarios").upsert(
      {
        email: user.email,
        nombre: user.nombre,
        password: user.password,
        rol: user.rol,
        departamento: user.departamento,
        telefono: user.telefono,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Error importing", user.email, error.message);
    } else {
      console.log(`Imported ${user.email} (${user.password})`);
    }
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/import_users.js users.txt");
    process.exit(1);
  }

  run(filePath)
    .then(() => console.log("Done"))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
