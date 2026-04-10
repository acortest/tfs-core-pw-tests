import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class InstructorHomePage extends BasePage {
  private readonly PAGE_CONFIRM = "div#main_content div.about_info p";
  private readonly PAGE_CONFIRM_TEXT = "This is your instructor homepage";
  private readonly CLASS = ".class_name > a[href*='%s']";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async confirmOnInstructorHomePage(): Promise<void> {
    await this.waitForVisible(this.PAGE_CONFIRM);
    const text = await this.getText(this.PAGE_CONFIRM);
    if (!text.includes(this.PAGE_CONFIRM_TEXT)) {
      throw new Error(`Not on instructor home page. Found: "${text}"`);
    }
  }

  async checkOnInstructorHomePage(): Promise<boolean> {
    try {
      await this.confirmOnInstructorHomePage();
      return true;
    } catch {
      return false;
    }
  }

  async gotoClassHome(classId: string): Promise<void> {
    const selector = this.CLASS.replace("%s", classId);
    await this.page.locator(selector).click();
  }
}
