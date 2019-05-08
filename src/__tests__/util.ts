import { SuperTest, Test } from "supertest";
import { Cookie } from "tough-cookie";

export async function login(
  server: SuperTest<Test>,
  email: string,
  password: string
): Promise<{ server: SuperTest<Test>; headers: object }> {
  const res = await server
    .post("/admin/rest/login")
    .send({
      email,
      password
    })
    .set("Accept", "application/json")
    .expect(204);

  const c = Cookie.parse(res.header["set-cookie"][0]);

  if (!c) {
    throw new Error("Could not set session cookie");
  }

  return {
    headers: { cookie: c.cookieString() },
    server
  };
}

export async function createRole(
  server: SuperTest<Test>,
  headers: object,
  name: string,
  permissions: any
) {
  const res = await server
    .post("/admin/rest/settings/roles")
    .set(headers)
    .send({
      data: {
        name,
        permissions
      }
    });

  return res.body.id;
}

export async function createUser(
  server: SuperTest<Test>,
  headers: object,
  email: string,
  newPassword: string,
  role: string
) {
  const res = await server
    .post("/admin/rest/settings/users")
    .set(headers)
    .send({
      data: {
        email,
        newPassword,
        name: email,
        role
      }
    });
  return res.body.id;
}

export async function withTempRole(
  server: SuperTest<Test>,
  permissions: any
): Promise<{ server: SuperTest<Test>; headers: object }> {
  const roleName = `temp-role-${Date.now()}`;
  const { headers } = await login(server, "admin@cotype.dev", "admin");
  const roleId = await createRole(server, headers, roleName, permissions);
  const email = `temp-user-${Date.now()}@cotype.dev`;
  const password = email;
  await createUser(server, headers, email, password, roleId);
  return login(server, email, password);
}
