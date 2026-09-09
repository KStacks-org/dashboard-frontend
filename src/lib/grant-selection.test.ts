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
    scope: "DEVS-ADMIN",
    name: "Devs",
    role: "ADMIN",
    serviceId: "devs",
    serviceCodename: "devs",
    isDashboard: false,
  },
  {
    id: "mentor",
    scope: "DEVS-MENTOR",
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
    expect(group.admin.scope).toBe("DEVS-ADMIN");
    expect(group.roles.map((role) => role.scope)).toEqual(["DEVS-MENTOR"]);
  });

  it("recognises only the built-in service ADMIN scope as delegating authority", () => {
    expect(serviceAdminScopesForUser(scopes, ["DEVS-ADMIN", "DEVS-MENTOR"])).toEqual([
      "DEVS-ADMIN",
    ]);
    expect(serviceAdminScopesForUser(scopes, ["DEVS-MENTOR"])).toEqual([]);
  });

  it("selecting ADMIN replaces narrower roles for only that service", () => {
    expect(selectServiceAdmin(["DEVS-MENTOR", "OTHER-MENTOR"], group, true)).toEqual([
      "OTHER-MENTOR",
      "DEVS-ADMIN",
    ]);
  });

  it("selecting a narrower role removes ADMIN for only that service", () => {
    expect(
      selectServiceRole(["DEVS-ADMIN", "OTHER-ADMIN"], "DEVS-ADMIN", "DEVS-MENTOR", true),
    ).toEqual(["OTHER-ADMIN", "DEVS-MENTOR"]);
  });
});
