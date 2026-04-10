import { Page, FrameLocator } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";
import path from "path";
import fs from "fs";

export class AssignmentInfoPage extends BasePage {
  readonly LTI_LAUNCHER = ".lti-launcher";
  readonly TOOL_PICKER = ".assignment_type_tool-picker";
  readonly APP_IFRAME = "#launcher-iframe";
  readonly TOOL_STUDENT_PICKER = "int-lti-launcher iframe";
  readonly INBOX_IFRAME = "//iframe[starts-with(@id, 'launch-frame-')]";
  readonly TFSPLUS_ASSIGNMENT_TITLE = "test assignment ";

  // LFW assignment creation selectors
  readonly LFW_ASSIGNMENT_TEXT = "Standard Assignment";
  readonly LFW_ASSIGNMENT_INPUT = ".tii-grn-text-input";
  readonly LFW_START_DATE = "input[data-px='assignment-scheduling-start-date']";
  readonly LFW_END_DATE = "input[data-px='assignment-scheduling-due-date']";
  readonly LFW_GRADE = "#max-points-tii-grn-input";
  readonly LFW_ASSIGNMENT_CONFIRM_BUTTON =
    "//tii-grn-button[.//span[normalize-space()='Create Assignment']]";

  // Student upload selectors (Playwright auto-pierces shadow DOM)
  readonly LFW_STUDENT_VIEW_DETAILS = "tdl-button:has-text('View Details')";
  readonly LFW_STUDENT_FILE_INPUT = ".input";
  readonly LFW_STUDENT_UPLOAD_CONFIRM = ".accept-button.hydrated";
  readonly LFW_STUDENT_SUBMIT_BUTTON = "tdl-button.accept-button";
  readonly LFW_STUDENT_PREVIEW_IMAGE = ".preview-image";
  readonly LFW_STUDENT_SUCCESS_UPLOAD =
    "//span[@slot='content']//p[text()='Your file was successfully uploaded.']";
  readonly LFW_STUDENT_INBOX_CONFIRMATION = ".link-button";
  readonly LFW_STUDENT_UPLOAD_DATE = ".date";
  readonly LFW_STUDENT_ENSURE_SUBMISSION_OPEN = ".center-container";

  private mfeFrame: FrameLocator | null = null;

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async navigateToToolpickerClickAssignment(
    assignmentType: string = "LFW"
  ): Promise<void> {
    await this.waitForVisible(this.TOOL_PICKER);

    const launchFrame = this.page.frameLocator(
      "iframe[id^='launch-frame-']"
    );

    const heading =
      assignmentType === "LFW"
        ? this.LFW_ASSIGNMENT_TEXT
        : "Handwritten Assignments";

    const target = launchFrame.locator("h3", { hasText: heading });
    await target.waitFor({ state: "visible", timeout: 30_000 });
    await target.click();

    try {
      const nested = launchFrame.frameLocator(this.APP_IFRAME);
      await nested
        .locator(this.LFW_ASSIGNMENT_INPUT)
        .waitFor({ state: "visible", timeout: 30_000 });
      this.mfeFrame = nested;
    } catch {
      try {
        await this.page.locator(this.APP_IFRAME).waitFor({
          state: "visible",
          timeout: 15_000,
        });
        this.mfeFrame = this.page.frameLocator(this.APP_IFRAME);
      } catch {
        this.mfeFrame = launchFrame;
      }
    }
  }

  private getMfeFrame(): FrameLocator {
    if (!this.mfeFrame) {
      this.mfeFrame = this.page.frameLocator(this.APP_IFRAME);
    }
    return this.mfeFrame;
  }

  async createLfwAssignment(
    assignmentName: string
  ): Promise<{ startDate: string; endDate: string; actualTitle: string }> {
    const frame = this.getMfeFrame();
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const startDate = `${currentYear}-01-01T00:00`;
    const endDate = `${nextYear}-01-01T23:59`;

    const nameInput = frame.locator(this.LFW_ASSIGNMENT_INPUT);
    await nameInput.waitFor({ state: "visible", timeout: 60_000 });
    await nameInput.fill(assignmentName);

    await frame.locator(this.LFW_START_DATE).fill(startDate);
    await frame.locator(this.LFW_END_DATE).fill(endDate);

    const gradeInput = frame.locator(this.LFW_GRADE);
    await gradeInput.click();
    await gradeInput.fill("100");

    // Click Create Assignment
    const confirmBtn = frame.locator(this.LFW_ASSIGNMENT_CONFIRM_BUTTON);
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.first().scrollIntoViewIfNeeded();
      await confirmBtn.first().click({ timeout: 10_000 });
    } else {
      await frame
        .getByRole("button", { name: /create assignment/i })
        .first()
        .click({ timeout: 10_000 });
    }

    // Wait for class home page to load
    await this.page.waitForTimeout(5000);
    await this.page
      .locator(
        "tr[data-assignment-title], .title-row, .add-assignment-button"
      )
      .first()
      .waitFor({ state: "visible", timeout: 60_000 });

    // Read the actual assignment title the server used
    const assignmentRow = this.page.locator("tr[data-assignment-title]");
    let actualTitle = "";
    if ((await assignmentRow.count()) > 0) {
      actualTitle =
        (await assignmentRow.first().getAttribute("data-assignment-title")) ??
        "";
    }
    console.log(`Assignment created: "${actualTitle}"`);

    this.mfeFrame = null;
    return { startDate, endDate, actualTitle };
  }

  async uploadLfwAssignment(filePath?: string): Promise<void> {
    const file =
      filePath ??
      path.resolve(this.config.uploadDir, "word_document.docx");

    // Wait for student MFE iframe
    await this.page
      .locator(this.TOOL_STUDENT_PICKER)
      .waitFor({ state: "visible", timeout: 60_000 });
    const studentFrame = this.page.frameLocator(this.TOOL_STUDENT_PICKER);

    // Click "View Details"
    const viewDetails = studentFrame.locator(this.LFW_STUDENT_VIEW_DETAILS);
    await viewDetails.waitFor({ state: "visible", timeout: 60_000 });
    await this.page.waitForTimeout(2000);
    await viewDetails.click();

    // Playwright's setInputFiles uses CDP which doesn't fire composed events
    // across shadow DOM. Instead, use DataTransfer API in-page to set files
    // and dispatch composed events that cross shadow boundaries.
    const fileInput = studentFrame.locator("tii-ing-single-file .input");
    await fileInput.waitFor({ state: "attached", timeout: 30_000 });

    const fileBuffer = fs.readFileSync(file);
    const base64 = fileBuffer.toString("base64");
    const fileName = path.basename(file);

    await fileInput.evaluate(
      (input, { data, name }) => {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new File([bytes], name, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const dt = new DataTransfer();
        dt.items.add(blob);
        const inp = input as HTMLInputElement;
        inp.files = dt.files;
        inp.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      },
      { data: base64, name: fileName }
    );

    await this.page.waitForTimeout(2000);

    // Click upload confirm
    const uploadConfirm = studentFrame.locator(
      this.LFW_STUDENT_UPLOAD_CONFIRM
    );
    await uploadConfirm.click({ timeout: 15_000 });

    // Wait for preview image
    await studentFrame
      .locator(this.LFW_STUDENT_PREVIEW_IMAGE)
      .waitFor({ state: "visible", timeout: 100_000 });

    // Click submit
    const submitBtn = studentFrame.locator(this.LFW_STUDENT_SUBMIT_BUTTON);
    await submitBtn.waitFor({ state: "visible", timeout: 100_000 });
    await submitBtn.click();

    // Wait for success message (may appear in iframe or on main page)
    try {
      await studentFrame
        .locator(this.LFW_STUDENT_SUCCESS_UPLOAD)
        .waitFor({ state: "visible", timeout: 15_000 });
    } catch {
      try {
        await studentFrame
          .locator("text=successfully uploaded")
          .waitFor({ state: "visible", timeout: 10_000 });
      } catch {
        await this.page
          .locator("text=successfully uploaded")
          .waitFor({ state: "visible", timeout: 15_000 });
      }
    }

    // Wait for inbox confirmation with retries
    await this.page.waitForTimeout(5000);
    for (let i = 0; i < 10; i++) {
      await this.page.reload({ waitUntil: "domcontentloaded" });
      await this.page.waitForTimeout(5000);
      try {
        await this.page
          .locator(this.TOOL_STUDENT_PICKER)
          .waitFor({ state: "visible", timeout: 15_000 });
        const frame2 = this.page.frameLocator(this.TOOL_STUDENT_PICKER);
        await frame2
          .locator(this.LFW_STUDENT_INBOX_CONFIRMATION)
          .waitFor({ state: "visible", timeout: 10_000 });
        break;
      } catch {
        if (i === 9)
          throw new Error(
            "Student submission not visible in inbox after retries"
          );
      }
    }
  }

  async retrieveLfwSubmissionData(): Promise<{
    paperId: string;
    submissionTitle: string;
    uploadDate: string;
  }> {
    await this.page.waitForTimeout(6000);

    await this.page
      .locator(this.TOOL_STUDENT_PICKER)
      .waitFor({ state: "visible", timeout: 60_000 });
    const studentFrame = this.page.frameLocator(this.TOOL_STUDENT_PICKER);

    const uploadDate =
      (await studentFrame
        .locator(this.LFW_STUDENT_UPLOAD_DATE)
        .waitFor({ state: "visible", timeout: 60_000 })
        .then(() =>
          studentFrame.locator(this.LFW_STUDENT_UPLOAD_DATE).textContent()
        )) ?? "";

    const titleEl = studentFrame.locator(this.LFW_STUDENT_INBOX_CONFIRMATION);
    await titleEl.waitFor({ state: "visible", timeout: 60_000 });
    const submissionTitle = (await titleEl.textContent()) ?? "";

    // Extract paper ID from the submission link href instead of opening a popup
    // (the popup has session transfer issues in Playwright)
    await this.page.waitForTimeout(5000);
    const href = await titleEl.evaluate((el) => {
      const anchor = el.closest("a") ?? el.querySelector("a") ?? el;
      return (anchor as HTMLAnchorElement).href || "";
    });

    let paperId = "";
    if (href.includes("/submission/trn:oid:::")) {
      paperId = href.split("/submission/trn:oid:::").pop() ?? "";
    } else {
      // Fallback: open the popup and grab URL even if the page errors
      const popupPromise = this.page.context().waitForEvent("page");
      await titleEl.click();
      const popup = await popupPromise;
      await popup.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(3000);
      const url = popup.url();
      if (url.includes("/submission/trn:oid:::")) {
        paperId = url.split("/submission/trn:oid:::").pop() ?? "";
      }
      await popup.close();
      await this.page.waitForTimeout(2000);
    }

    console.log(`Paper ID extracted: ${paperId}`);
    return { paperId, submissionTitle, uploadDate };
  }

  async switchToInboxIframe(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.waitForVisible(this.LTI_LAUNCHER);
    await this.page
      .locator(this.INBOX_IFRAME)
      .waitFor({ state: "visible" });
  }
}
