import { SuperTest, Test } from "supertest";
export declare function login(server: SuperTest<Test>, email: string, password: string): Promise<{
    server: SuperTest<Test>;
    headers: object;
}>;
export declare function createRole(server: SuperTest<Test>, headers: object, name: string, permissions: any): Promise<any>;
export declare function createUser(server: SuperTest<Test>, headers: object, email: string, newPassword: string, role: string): Promise<any>;
export declare function withTempRole(server: SuperTest<Test>, permissions: any): Promise<{
    server: SuperTest<Test>;
    headers: object;
}>;
