import { Page, expect } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class StudentPortfolioPage extends BasePage {
  private readonly ASSIGNMENT_ROWS = "tbody tr .title-column";
  private readonly SUBMIT_BUTTON = ".btn.btn-primary.btn-open";
  private readonly ASSIGNMENT_ROW =
    "tr[data-assignment-title='{title}'] .title-column";
  private readonly VIEW_ASSIGNMENT =
    "tr[data-assignment-title='{title}'] .btn.btn-primary.btn-open";
  private readonly EXPAND_INFO =
    "#assignment-heading button[aria-expanded='false']";
  private readonly INSTRUCTIONS = "#assignment div.row:nth-of-type(1) p";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async navigateToNewlyCreatedClassAssignment(
    assignmentTitle: string
  ): Promise<void> {
    // Wait for assignment table to load
    await this.page.locator("tbody tr").first().waitFor({
      state: "visible",
      timeout: 60_000,
    });

    // Try data-attribute selector first (works for classic class home)
    const byAttr = this.page.locator(
      `tr[data-assignment-title='${assignmentTitle}'] ${this.SUBMIT_BUTTON}`
    );
    if ((await byAttr.count()) > 0) {
      await byAttr.click();
      await this.page.waitForTimeout(2000);
      return;
    }

    // Fallback: find the row that contains the title text and click Open
    const rows = this.page.locator("tbody tr");
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).textContent()) ?? "";
      if (text.includes(assignmentTitle)) {
        const row = rows.nth(i);
        const btn = row.locator(
          [
            this.SUBMIT_BUTTON,
            "a:has-text('Open')",
            "button:has-text('Open')",
            "input[value='Open']",
            "input.btn",
          ].join(", ")
        );
        if ((await btn.count()) > 0) {
          await btn.first().click();
          await this.page.waitForTimeout(3000);
          return;
        }
      }
    }

    throw new Error(
      `Assignment "${assignmentTitle}" not found in student portfolio`
    );
  }

  async getAssignmentRowText(assignmentTitle: string): Promise<string> {
    const selector = this.ASSIGNMENT_ROW.replace("{title}", assignmentTitle);
    await this.page.locator(selector).waitFor({ state: "visible", timeout: 60_000 });
    return this.getText(selector);
  }

  async clickViewAssignment(assignmentTitle: string): Promise<void> {
    const selector = this.VIEW_ASSIGNMENT.replace("{title}", assignmentTitle);
    await this.page.locator(selector).waitFor({ state: "visible" });
    await this.page.locator(selector).click();
  }

  async expandAssignmentInfo(): Promise<void> {
    const expandBtn = this.page.locator(this.EXPAND_INFO);
    if ((await expandBtn.count()) > 0) {
      await expandBtn.click();
    }
  }

  async getInstructionsText(): Promise<string> {
    await this.page.locator(this.INSTRUCTIONS).waitFor({ state: "visible" });
    return this.getText(this.INSTRUCTIONS);
  }
}
