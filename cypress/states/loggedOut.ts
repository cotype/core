export function logout() {
  return cy.clearCookies().visit("/");
}

export default function whenLoggedOut() {
  beforeEach(logout);
}
