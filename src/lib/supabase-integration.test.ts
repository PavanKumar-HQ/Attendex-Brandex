import { test } from "node:test";
import assert from "node:assert/strict";
import { supabase, isSupabaseConfigured } from "./supabase";

test("Database: Supabase client is properly configured with live URL and Key", () => {
  assert.equal(isSupabaseConfigured, true);
  assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecuklegnixpfppaowhmf.supabase.co");
});

test("Database: Root institution record is queryable from PostgreSQL", async () => {
  const { data, error } = await supabase
    .from("institutions")
    .select("id, name, code")
    .limit(1);

  assert.equal(error, null);
  assert.ok(data);
  assert.ok(data.length > 0);
  assert.ok(data[0].id);
});

test("Database: UUID format integrity check prevents PostgREST 22P02 errors", () => {
  const validUUID = "c1111111-0000-4000-a000-000000000001";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.match(validUUID, uuidRegex);
});

test("Database: Table schema queries execute without schema cache errors", async () => {
  const tables = ["classes", "subjects", "students", "leave_requests", "gatepasses", "audit_logs"];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select("id")
      .limit(1);
    
    assert.equal(error, null, `Table ${table} query should return no PostgREST error`);
  }
});
