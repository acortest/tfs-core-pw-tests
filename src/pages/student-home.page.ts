import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class StudentHomePage extends BasePage {
  private readonly PAGE_CONFIRM =
    "div#main_content div.about_info > p:nth-child(2)";
  private readonly PAGE_CONFIRM_TEXT = "This is your student homepage";
  private readonly CLASS = ".class_name > a[href*='%s']";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async confirmOnStudentHomePage(): Promise<void> {
    await this.waitForVisible(this.PAGE_CONFIRM);
    const text = await this.getText(this.PAGE_CONFIRM);
    if (!text.includes(this.PAGE_CONFIRM_TEXT)) {
      throw new Error(`Not on student home page. Found: "${text}"`);
    }
  }

  async gotoClassHome(classId: string): Promise<void> {
    const selector = this.CLASS.replace("%s", classId);
    await this.page.locator(selector).click();
  }
}
