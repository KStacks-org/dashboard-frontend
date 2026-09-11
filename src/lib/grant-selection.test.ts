import { describe, expect, it } from "vitest";
import {
  groupServiceScopes,
  selectServiceAdmin,
  selectServiceRole,
  serviceAdminScopesForUser,
} from "./grant-selection";
import type { AdminScope } from "./types";

const scopes: AdminScope[] = [
  {
    id: null,
    scope: "devs-admin",
    name: "Devs",
    role: "ADMIN",
    serviceId: "devs",
    serviceCodename: "devs",
    isDashboard: false,
  },
  {
    id: "mentor",
    scope: "devs-mentor",
    name: "Devs",
    role: "MENTOR",
    serviceId: "devs",
    serviceCodename: "devs",
    isDashboard: false,
  },
];

describe("service grant selection", () => {
  const group = groupServiceScopes(scopes)[0];
  if (!group) throw new Error("Expected the Devs scope group");

  it("groups custom roles under their service admin scope", () => {
    expect(group.admin.scope).toBe("devs-admin");
    expect(group.roles.map((role) => role.scope)).toEqual(["devs-mentor"]);
  });

  it("recognises only the built-in service ADMIN scope as delegating authority", () => {
    expect(serviceAdminScopesForUser(scopes, ["devs-admin", "devs-mentor"])).toEqual([
      "devs-admin",
    ]);
    expect(serviceAdminScopesForUser(scopes, ["devs-mentor"])).toEqual([]);
  });

  it("selecting ADMIN replaces narrower roles for only that service", () => {
    expect(selectServiceAdmin(["devs-mentor", "other-mentor"], group, true)).toEqual([
      "other-mentor",
      "devs-admin",
    ]);
  });

  it("selecting a narrower role removes ADMIN for only that service", () => {
    expect(
      selectServiceRole(["devs-admin", "other-admin"], "devs-admin", "devs-mentor", true),
    ).toEqual(["other-admin", "devs-mentor"]);
  });
});
