import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class BreadcrumbsPage extends BasePage {
  private readonly ROOT_1 = "div#bread_crumbs";
  private readonly ROOT_2 = "div#breadcrumbs";
  private readonly BREADCRUMB_LINKS = "a";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async checkBreadcrumbsOnPage(): Promise<boolean> {
    const root1 = await this.elementExists(this.ROOT_1, 3000);
    const root2 = await this.elementExists(this.ROOT_2, 3000);
    return root1 || root2;
  }

  async clickHomeBreadcrumb(): Promise<boolean> {
    const root = (await this.elementExists(this.ROOT_1, 3000))
      ? this.ROOT_1
      : this.ROOT_2;

    const links = this.page.locator(`${root} ${this.BREADCRUMB_LINKS}`);
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const text = (await links.nth(i).textContent()) ?? "";
      if (text.toUpperCase() === "HOME") {
        await links.nth(i).click();
        return true;
      }
    }
    return false;
  }

  async clickClassHomeBreadcrumb(): Promise<void> {
    await this.page
      .locator("#bread_crumbs a[href*='instructor_home']")
      .click();
  }
}
