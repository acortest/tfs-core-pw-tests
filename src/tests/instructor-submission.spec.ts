import { test, expect } from "../fixtures/turnitin.fixture.js";
import { getDateNextYear } from "../api/turnitin-api.js";
import crypto from "crypto";

test.describe("Instructor Paper Assignment @smoke @classic", () => {
  let testClassId: string;

  test.beforeEach(async ({ config, api, turnitin, loginAsInstructor }) => {
    const sdk = config.sdkWrapperRestApi;
    const uuid = crypto.randomUUID().slice(0, 8);

    const endDate = getDateNextYear();
    testClassId = await api.createClass({
      title: `paper_test_class_${uuid}`,
      endDate,
      instructorEmail: config.instructorUsername,
      restApi: sdk,
    });
    console.log(`Test class created: ${testClassId}`);

    await api.addUserToClass(
      testClassId,
      config.studentUsername,
      "Student",
      sdk
    );

    await loginAsInstructor();
    await turnitin.tHome.gotoClassHome(testClassId);
  });

  test.afterEach(async ({ config, api }) => {
    if (testClassId) {
      try {
        await api.destroyExistingClass(
          "paper_test",
          testClassId,
          config.sdkWrapperRestApi
        );
        console.log(`Class destroyed: ${testClassId}`);
      } catch (e) {
        console.warn(`Failed to destroy class ${testClassId}: ${e}`);
      }
    }
  });

  test("Student sees Korean assignment title and instructions @smoke @classic", async ({
    turnitin,
    logoutAndLoginAsStudent,
    logoutAndLoginAsInstructor,
  }) => {
    const koreanTitle = "클래스에 과제를";
    const koreanInstructions = "고급 과제 옵션을 보려면";

    await test.step("Create assignment with Korean title and instructions", async () => {
      await turnitin.tStandardClass.clickAddAssignmentButton();
      await turnitin.tModifyAssignment.createAssignmentWithSpecificTitleAndInstructions(
        koreanTitle,
        koreanInstructions,
        { nearFutureDate: true }
      );
    });

    await test.step("Verify assignment created on class home", async () => {
      await turnitin.breadcrumbs.clickClassHomeBreadcrumb();
      const count = await turnitin.tClassHome.getClassAssignments(koreanTitle);
      expect(count).toBeGreaterThan(0);
    });

    let assignTitle: string;
    let assignInstructions: string;

    await test.step("Wait for assignment start date to pass, then login as student", async () => {
      // Start date is 2 minutes in the future; wait so the student can see it
      await turnitin.tModifyAssignment.waitForStartDateToAge(130_000);
      await logoutAndLoginAsStudent();
      await turnitin.sHome.gotoClassHome(testClassId);
      assignTitle = await turnitin.sClassPortfolio.getAssignmentRowText(koreanTitle);
      expect(assignTitle).toContain(koreanTitle);
    });

    await test.step("Open assignment and verify instructions", async () => {
      await turnitin.sClassPortfolio.clickViewAssignment(koreanTitle);
      await turnitin.sClassPortfolio.expandAssignmentInfo();
      assignInstructions = await turnitin.sClassPortfolio.getInstructionsText();
      expect(assignInstructions).toContain(koreanInstructions);
    });

    await test.step("Login as instructor and delete assignment", async () => {
      await logoutAndLoginAsInstructor();
      await turnitin.tHome.gotoClassHome(testClassId);
      await turnitin.tClassHome.deleteAssignment(koreanTitle);
    });
  });

  test("Create new paper assignment @smoke @performance", async ({
    turnitin,
  }) => {
    let assignmentTitle: string;

    await test.step("Click add assignment", async () => {
      await turnitin.tStandardClass.clickAddAssignmentButton();
    });

    await test.step("Fill form and create assignment", async () => {
      assignmentTitle = await turnitin.tModifyAssignment.createAssignment();
    });

    await test.step(
      "Navigate to class home and delete assignment",
      async () => {
        await turnitin.breadcrumbs.clickClassHomeBreadcrumb();
        await turnitin.tClassHome.deleteAssignment(assignmentTitle!);
      }
    );
  });
});
