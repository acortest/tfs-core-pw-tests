import { test, expect } from "../fixtures/turnitin.fixture.js";
import { GrafPage } from "../pages/graf.page.js";
import { getDateNextYear } from "../api/turnitin-api.js";
import crypto from "crypto";

test.describe("Instructor GRAF Grading @uat @tfsplus @grafplus", () => {
  let testClassId: string;
  let paperId: string | null = null;
  let assignmentName: string;

  test.beforeEach(
    async ({
      config,
      api,
      turnitin,
      loginAsInstructor,
      logoutAndLoginAsStudent,
    }) => {
      const sdk = config.sdkWrapperRestApiTfsplus;
      const uuid = crypto.randomUUID().slice(0, 8);
      assignmentName =
        turnitin.assignmentInfo.TFSPLUS_ASSIGNMENT_TITLE + uuid;

      // ── Create class via API ──
      const endDate = getDateNextYear();
      testClassId = await api.createClass({
        title: `graf_test_class_${uuid}`,
        endDate,
        instructorEmail: config.instructorUsername,
        restApi: sdk,
      });
      console.log(`Test class created: ${testClassId}`);

      // ── Add student to class ──
      await api.addUserToClass(
        testClassId,
        config.studentUsername,
        "Student",
        sdk
      );

      // ── Login as instructor ──
      await loginAsInstructor();

      // ── Navigate to class and create LFW assignment ──
      await turnitin.tHome.gotoClassHome(testClassId);
      await turnitin.tStandardClass.clickAddAssignmentButton();
      await turnitin.assignmentInfo.navigateToToolpickerClickAssignment("LFW");
      const result = await turnitin.assignmentInfo.createLfwAssignment(assignmentName);
      // Use the actual title from the DOM (web component may ignore our name)
      const effectiveTitle = result.actualTitle || assignmentName;
      assignmentName = effectiveTitle;

      // ── View assignment inbox as instructor ──
      await turnitin.tClassHome.navigateToAssignmentInbox(assignmentName);

      // ── Switch to student, upload submission ──
      await logoutAndLoginAsStudent();
      await turnitin.tHome.gotoClassHome(testClassId);
      await turnitin.sClassPortfolio.navigateToNewlyCreatedClassAssignment(
        assignmentName
      );
      await turnitin.assignmentInfo.uploadLfwAssignment();

      const submissionData =
        await turnitin.assignmentInfo.retrieveLfwSubmissionData();
      paperId = submissionData.paperId;
    }
  );

  test.afterEach(async ({ config, api }) => {
    // ── Cleanup: destroy submission ──
    if (paperId) {
      try {
        const submissionId = `oid:${paperId}`;
        await api.destroySubmissionPandaApi(
          submissionId,
          config.pandaSubmissionPurgeApi
        );
        console.log(`Submission destroyed: ${paperId}`);
      } catch (e) {
        console.warn(`Failed to destroy submission ${paperId}: ${e}`);
      }
    }

    // ── Cleanup: destroy class ──
    if (testClassId) {
      try {
        await api.destroyExistingClass(
          "graf_test",
          testClassId,
          config.sdkWrapperRestApiTfsplus
        );
        console.log(`Class destroyed: ${testClassId}`);
      } catch (e) {
        console.warn(`Failed to destroy class ${testClassId}: ${e}`);
      }
    }
  });

  test(
    "Instructor grades a GRAF submission @critical @smoke",
    async ({ page, config, turnitin, logoutAndLoginAsInstructor }) => {
      // ── Step 1: Open assignment inbox as instructor ──
      await test.step("Open assignment inbox as instructor", async () => {
        await logoutAndLoginAsInstructor();
        await turnitin.tHome.gotoClassHome(testClassId);
        await turnitin.tClassHome.navigateToAssignmentInbox(assignmentName);
        await turnitin.tInbox.switchToInboxIframe();
      });

      // ── Step 2: Launch GRAF grading and enter grade ──
      let grafPopup: import("@playwright/test").Page;
      await test.step("Launch GRAF grading and enter grade", async () => {
        grafPopup = await turnitin.tInbox.launchFirstSubmissionGrading();
        const graf = new GrafPage(grafPopup, config);
        await graf.waitGradingToLoad();
        await graf.typeGrade("99");
        await graf.closeGrafWindow(page);
      });

      // ── Step 3: Refresh and verify the saved grade ──
      await test.step("Close grading and verify saved grade", async () => {
        await page.reload({ waitUntil: "domcontentloaded" });
        await turnitin.tInbox.switchToInboxIframe();
        await turnitin.tInbox.validateGrading("99");
      });
    }
  );
});
