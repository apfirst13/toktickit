import { describe, it } from "vitest";

describe("Users Admin API", () => {
  it.todo("should return 201 when admin creates user (API-09)");
  it("should return 400 when admin attempts to deactivate self (API-10)", async () => {
    // Both admin_test1 and admin_test2 are active, so count is 2.
    // Deactivating self should hit the "self" check, not the "last admin" check.
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isActive: false
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/themselves/i);
  });

  it("should return 400 when admin attempts to deactivate last admin (API-11)", async () => {
    // Delete all admins EXCEPT admin_test1
    await prisma.user.deleteMany({
      where: {
        role: 'ADMINISTRATOR',
        id: { not: adminUserId }
      }
    });

    // Now admin_test1 is the ONLY active admin in the DB.
    // If admin_test1 tries to deactivate themselves, it will hit the "last admin" check FIRST.
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isActive: false
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/last active administrator/i);
  });
});
