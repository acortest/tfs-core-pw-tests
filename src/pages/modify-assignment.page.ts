import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";
import crypto from "crypto";

export class ModifyAssignmentPage extends BasePage {
  private readonly ASSIGNMENT_TITLE = "#title";
  private readonly POINT_VALUE = "#max_points";
  private readonly DATE_START = "#date_start_input input";
  private readonly SUBMIT = "button.submit-btn";
  private readonly HOME_BREAD_CRUMB =
    "#bread_crumbs a[href*='instructor_home']";
  private readonly EXPAND_OPTIONAL_SETTINGS = "a[href*='advancedOptions']";
  private readonly EXPAND_OPTIONAL_SETTINGS_ROOT = ".submission-settings";
  private readonly SAVE_AS_DEFAULT_CHECKBOX = "#instructor_id_for_defaults";
  private readonly INSTRUCTIONS_BOX = "#instructions";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  private readonly PAGE_CONFIRM = "div.about-this-page";

  async waitForFormToLoad(): Promise<void> {
    await this.page.locator(this.PAGE_CONFIRM).waitFor({ state: "visible", timeout: 30_000 });
  }

  async waitForStartDateToAge(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  async createAssignment(): Promise<string> {
    const assignmentTitle = await this.fillInInitialForms();
    await this.page.locator(this.SUBMIT).click();
    await this.page.locator(this.SUBMIT).waitFor({ state: "hidden" });
    await this.page
      .locator(this.HOME_BREAD_CRUMB)
      .waitFor({ state: "visible", timeout: 60_000 });
    return assignmentTitle;
  }

  private async fillInInitialForms(): Promise<string> {
    const assignmentTitle = "DELETE_ME_" + crypto.randomUUID().slice(0, 8);

    await this.clearAndType(this.ASSIGNMENT_TITLE, assignmentTitle);
    await this.fillInValidStartDate();

    const pointsVisible = await this.elementExists(this.POINT_VALUE, 3000);
    if (pointsVisible) {
      await this.clearAndType(this.POINT_VALUE, "11");
    }

    return assignmentTitle;
  }

  async createAssignmentWithSpecificTitleAndInstructions(
    title: string,
    instructions?: string,
    options?: { defaultDate?: boolean; nearFutureDate?: boolean }
  ): Promise<void> {
    if (options?.nearFutureDate) {
      await this.fillInNearFutureStartDate();
    } else if (!options?.defaultDate) {
      await this.fillInValidStartDate();
    }

    await this.clearAndType(this.ASSIGNMENT_TITLE, title);

    const pointsVisible = await this.elementExists(this.POINT_VALUE, 3000);
    if (pointsVisible) {
      await this.clearAndType(this.POINT_VALUE, "11");
    }

    if (instructions) {
      await this.expandOptionalSettings();
      await this.clearAndType(this.INSTRUCTIONS_BOX, instructions);
    }

    await this.page.locator(this.SUBMIT).scrollIntoViewIfNeeded();
    await this.page.locator(this.SUBMIT).click();
    await this.page
      .locator(this.HOME_BREAD_CRUMB)
      .waitFor({ state: "visible", timeout: 60_000 });
  }

  private async expandOptionalSettings(): Promise<void> {
    await this.page.locator(this.SUBMIT).waitFor({ state: "visible" });
    const optionsVisible = await this.elementExists(
      this.EXPAND_OPTIONAL_SETTINGS_ROOT,
      3000
    );
    if (!optionsVisible) {
      await this.page.locator(this.EXPAND_OPTIONAL_SETTINGS).click();
      await this.page
        .locator(this.SAVE_AS_DEFAULT_CHECKBOX)
        .waitFor({ state: "visible" });
    }
  }

  private async fillInStartDate(minutesFromNow: number): Promise<void> {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutesFromNow);
    const dateStr = this.formatDate(date);
    const loc = this.page.locator(this.DATE_START);
    await loc.click();
    await loc.clear();
    await loc.fill(dateStr);
  }

  private async fillInValidStartDate(): Promise<void> {
    await this.fillInStartDate(30 * 24 * 60); // ~1 month from now
  }

  private async fillInNearFutureStartDate(): Promise<void> {
    await this.fillInStartDate(2); // 2 minutes from now
  }

  private formatDate(date: Date): string {
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0") +
      " " +
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0")
    );
  }
}
