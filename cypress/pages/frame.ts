export default {
  navigation(item) {
    return cy.testable("main-navigation-item").contains(item);
  },
  sidebarItems() {
    return this.sidebar().find("a");
  },
  sidebarItem(item) {
    return this.sidebarItems().contains(item);
  },
  sidebar() {
    return cy.testable("models-sidebar");
  },
  navigationGroup(name) {
    return cy.testable("models-sidebar").testable("sidebar-group");
  }
};
