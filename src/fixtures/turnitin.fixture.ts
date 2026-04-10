import { test as base, Page } from "@playwright/test";
import { loadConfig, EnvironmentConfig } from "../config/environment.js";
import { TurnitinApi } from "../api/turnitin-api.js";
import { LoginPage } from "../pages/login.page.js";
import { TopNavPage } from "../pages/top-nav.page.js";
import { BreadcrumbsPage } from "../pages/breadcrumbs.page.js";
import { InstructorHomePage } from "../pages/instructor-home.page.js";
import { StudentHomePage } from "../pages/student-home.page.js";
import { ClassHomePage } from "../pages/class-home.page.js";
import { StandardClassPage } from "../pages/standard-class.page.js";
import { AssignmentInfoPage } from "../pages/assignment-info.page.js";
import { StudentPortfolioPage } from "../pages/student-portfolio.page.js";
import { InboxPage } from "../pages/inbox.page.js";
import { ModifyAssignmentPage } from "../pages/modify-assignment.page.js";

export interface TurnitinPages {
  loginPage: LoginPage;
  topNav: TopNavPage;
  breadcrumbs: BreadcrumbsPage;
  tHome: InstructorHomePage;
  sHome: StudentHomePage;
  tClassHome: ClassHomePage;
  tStandardClass: StandardClassPage;
  assignmentInfo: AssignmentInfoPage;
  sClassPortfolio: StudentPortfolioPage;
  tInbox: InboxPage;
  tModifyAssignment: ModifyAssignmentPage;
}

export interface TurnitinFixture {
  config: EnvironmentConfig;
  api: TurnitinApi;
  turnitin: TurnitinPages;
  loginAsInstructor: () => Promise<void>;
  loginAsStudent: () => Promise<void>;
  logoutAndLoginAsInstructor: () => Promise<void>;
  logoutAndLoginAsStudent: () => Promise<void>;
  ensureOnInstructorHomePage: () => Promise<void>;
  ensureOnStudentHomePage: () => Promise<void>;
}

export const test = base.extend<TurnitinFixture>({
  config: async ({}, use) => {
    await use(loadConfig());
  },

  api: async ({ request }, use) => {
    await use(new TurnitinApi(request));
  },

  turnitin: async ({ page, config }, use) => {
    await use(createTurnitinPages(page, config));
  },

  loginAsInstructor: async ({ page, config, turnitin }, use) => {
    const fn = async () => {
      await turnitin.loginPage.login(
        config.instructorUsername,
        config.instructorPassword,
        config.tiiLoginUrl
      );
      await turnitin.topNav.switchLanguageType(config.language);
    };
    await use(fn);
  },

  loginAsStudent: async ({ page, config, turnitin }, use) => {
    const fn = async () => {
      await turnitin.loginPage.login(
        config.studentUsername,
        config.studentPassword,
        config.tiiLoginUrl
      );
      await turnitin.topNav.switchLanguageType(config.language);
    };
    await use(fn);
  },

  logoutAndLoginAsInstructor: async ({ config, turnitin }, use) => {
    const fn = async () => {
      await turnitin.topNav.logout();
      await turnitin.loginPage.login(
        config.instructorUsername,
        config.instructorPassword,
        config.tiiLoginUrl
      );
      await turnitin.topNav.switchLanguageType(config.language);
    };
    await use(fn);
  },

  logoutAndLoginAsStudent: async ({ config, turnitin }, use) => {
    const fn = async () => {
      await turnitin.topNav.logout();
      await turnitin.loginPage.login(
        config.studentUsername,
        config.studentPassword,
        config.tiiLoginUrl
      );
      await turnitin.topNav.switchLanguageType(config.language);
    };
    await use(fn);
  },

  ensureOnInstructorHomePage: async ({ turnitin }, use) => {
    const fn = async () => {
      await turnitin.topNav.switchToInstructorUserType();
      const isOnPage = await turnitin.tHome.checkOnInstructorHomePage();
      if (isOnPage) return;
      const hasBreadcrumbs = await turnitin.breadcrumbs.checkBreadcrumbsOnPage();
      if (!hasBreadcrumbs) {
        // fallback: navigate via clicking messages then home
        await turnitin.topNav.switchToInstructorUserType();
      }
      await turnitin.breadcrumbs.clickHomeBreadcrumb();
      await turnitin.tHome.confirmOnInstructorHomePage();
    };
    await use(fn);
  },

  ensureOnStudentHomePage: async ({ turnitin }, use) => {
    const fn = async () => {
      await turnitin.topNav.switchToStudentUserType();
      const hasBreadcrumbs = await turnitin.breadcrumbs.checkBreadcrumbsOnPage();
      if (!hasBreadcrumbs) {
        await turnitin.topNav.switchToStudentUserType();
      }
      await turnitin.breadcrumbs.clickHomeBreadcrumb();
      await turnitin.sHome.confirmOnStudentHomePage();
    };
    await use(fn);
  },
});

function createTurnitinPages(
  page: Page,
  config: EnvironmentConfig
): TurnitinPages {
  return {
    loginPage: new LoginPage(page, config),
    topNav: new TopNavPage(page, config),
    breadcrumbs: new BreadcrumbsPage(page, config),
    tHome: new InstructorHomePage(page, config),
    sHome: new StudentHomePage(page, config),
    tClassHome: new ClassHomePage(page, config),
    tStandardClass: new StandardClassPage(page, config),
    assignmentInfo: new AssignmentInfoPage(page, config),
    sClassPortfolio: new StudentPortfolioPage(page, config),
    tInbox: new InboxPage(page, config),
    tModifyAssignment: new ModifyAssignmentPage(page, config),
  };
}

export { expect } from "@playwright/test";
