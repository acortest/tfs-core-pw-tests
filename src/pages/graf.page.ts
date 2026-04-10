import { Page, expect } from "@playwright/test";
import { EnvironmentConfig } from "../config/environment.js";

/**
 * Graf page object for the grading popup window.
 * This page runs in a separate browser tab/popup, so it receives
 * the popup `Page` instance rather than the main page.
 */
export class GrafPage {
  private readonly GRADING_INPUT = "input.tdl-number-input";

  constructor(
    private popup: Page,
    private config: EnvironmentConfig
  ) {}

  async waitGradingToLoad(): Promise<void> {
    // Playwright auto-pierces shadow DOM, so we can locate
    // tii-router > tii-grade-submission > tdl-number-input > input
    // with a simple CSS selector.
    await this.popup
      .locator(this.GRADING_INPUT)
      .waitFor({ state: "visible", timeout: 60_000 });
  }

  async typeGrade(grade: string): Promise<void> {
    const input = this.popup.locator(this.GRADING_INPUT);
    await input.click();
    await input.fill(grade);
    await input.press("Enter");
    await this.popup.waitForTimeout(5000);
  }

  async closeGrafWindow(mainPage: Page): Promise<void> {
    await this.popup.close();
    await mainPage.bringToFront();
  }
}
