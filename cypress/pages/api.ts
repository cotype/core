function api(url: string) {
  return {
    get(path: string) {
      return cy.request({
        url: `${url}/${path}`
      });
    }
  };
}

export default {
  rest: {
    published() {
      return api("/rest/published");
    },
    drafts() {
      return api("/rest/drafts");
    }
  }
};
