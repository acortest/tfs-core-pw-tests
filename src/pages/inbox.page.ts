import { Page, FrameLocator, expect } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class InboxPage extends BasePage {
  readonly LFW_IFRAME = "//iframe[starts-with(@id, 'launch-frame-')]";
  readonly LFW_SUBMISSION_GRADING_DIV = "tii-mpdd-grade-with-launch-display";
  readonly LFW_SUBMISSION_GRADING = "tii-grn-icon[icon-name='edit']";
  readonly LFW_SUBMISSION_GRADE = "div.badge span";

  private inboxFrame: FrameLocator | null = null;

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async switchToInboxIframe(): Promise<FrameLocator> {
    await this.page
      .locator(this.LFW_IFRAME)
      .waitFor({ state: "visible", timeout: 30_000 });
    this.inboxFrame = this.page.frameLocator(this.LFW_IFRAME);
    return this.inboxFrame;
  }

  private getFrame(): FrameLocator {
    if (!this.inboxFrame) {
      this.inboxFrame = this.page.frameLocator(this.LFW_IFRAME);
    }
    return this.inboxFrame;
  }

  async launchFirstSubmissionGrading(): Promise<Page> {
    let frame = this.getFrame();

    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        const gradeBtnDiv = frame.locator(this.LFW_SUBMISSION_GRADING_DIV);
        await gradeBtnDiv.first().waitFor({ state: "visible", timeout: 15_000 });

        const gradeBtn = gradeBtnDiv.first().locator(this.LFW_SUBMISSION_GRADING);
        await gradeBtn.waitFor({ state: "visible", timeout: 10_000 });

        const popupPromise = this.page.context().waitForEvent("page");
        this.page.once("dialog", (d) => d.accept());

        await gradeBtn.click();
        await this.page.waitForTimeout(1000);

        const popup = await popupPromise;
        await popup.waitForLoadState("domcontentloaded");
        return popup;
      } catch {
        if (attempt === 11) throw new Error("Grade button not found after retries");
        console.log(`Grade button not found, retrying (${attempt + 1}/12)...`);
        await this.page.reload({ waitUntil: "domcontentloaded" });
        await this.page.waitForTimeout(5000);
        await this.switchToInboxIframe();
        frame = this.getFrame();
      }
    }
    throw new Error("Unreachable");
  }

  async validateGrading(expectedGrade: string): Promise<void> {
    const frame = this.getFrame();
    const gradeBtnDiv = frame.locator(this.LFW_SUBMISSION_GRADING_DIV);
    await gradeBtnDiv.waitFor({ state: "visible", timeout: 30_000 });

    const gradeEl = gradeBtnDiv.locator(this.LFW_SUBMISSION_GRADE);
    await gradeEl.waitFor({ state: "visible", timeout: 30_000 });

    const gradeText = (await gradeEl.textContent()) ?? "";
    expect(gradeText.trim()).toBe(expectedGrade);
  }
}
