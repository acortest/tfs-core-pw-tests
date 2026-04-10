import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class ClassHomePage extends BasePage {
  private readonly VIEW_ASSIGNMENT_NEW_WORKFLOW =
    "tr[data-assignment-title='{title}'] .actions-column a";
  private readonly DELETE_ASSIGNMENT_TOGGLE =
    "tr[data-assignment-title='{title}'] .options-dropdown";
  private readonly DELETE_ASSIGNMENT_LINK =
    "tr[data-assignment-title='{title}'] .assignment-delete";
  private readonly DELETE_CONFIRM = "button[class='btn btn-primary confirm-button']";
  private readonly DELETE_MODAL_TEXT = "div[class='modal-body'] p";
  private readonly ASSIGNMENTS = ".title-row";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async navigateToAssignmentInbox(assignmentTitle: string): Promise<void> {
    const selector = this.VIEW_ASSIGNMENT_NEW_WORKFLOW.replace(
      "{title}",
      assignmentTitle
    );
    // The class home page may take time to load after assignment creation
    await this.page.locator(selector).waitFor({
      state: "visible",
      timeout: 60_000,
    });
    await this.page.locator(selector).click();
  }

  async deleteAssignment(assignmentTitle: string): Promise<void> {
    const toggleSelector = this.DELETE_ASSIGNMENT_TOGGLE.replace(
      "{title}",
      assignmentTitle
    );
    const deleteSelector = this.DELETE_ASSIGNMENT_LINK.replace(
      "{title}",
      assignmentTitle
    );

    const toggle = this.page.locator(toggleSelector);
    const deleteLink = this.page.locator(deleteSelector);

    await toggle.waitFor({ state: "visible" });

    // The dropdown can be flaky — retry the toggle click if the menu doesn't open
    for (let attempt = 0; attempt < 3; attempt++) {
      await toggle.click();
      try {
        await deleteLink.waitFor({ state: "visible", timeout: 5_000 });
        break;
      } catch {
        if (attempt === 2) throw new Error("Delete dropdown did not open after 3 attempts");
      }
    }

    await deleteLink.click();

    const alertText = await this.getText(this.DELETE_MODAL_TEXT);
    if (!alertText.includes("Are you sure you want to delete this")) {
      throw new Error(`Unexpected delete modal text: "${alertText}"`);
    }
    await this.page.locator(this.DELETE_CONFIRM).click();
  }

  async getClassAssignments(
    title?: string
  ): Promise<number> {
    const rows = this.page.locator(this.ASSIGNMENTS);
    if (!title) return rows.count();

    let count = 0;
    const total = await rows.count();
    for (let i = 0; i < total; i++) {
      const text = (await rows.nth(i).textContent()) ?? "";
      if (text.includes(title)) count++;
    }
    return count;
  }
}
