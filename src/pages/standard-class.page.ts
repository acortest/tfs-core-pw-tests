import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class StandardClassPage extends BasePage {
  readonly ADD_ASSIGNMENT_BUTTON = ".add-assignment-button";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async clickAddAssignmentButton(): Promise<void> {
    await this.page.locator(this.ADD_ASSIGNMENT_BUTTON).click();
  }
}
