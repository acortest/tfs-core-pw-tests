import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class TopNavPage extends BasePage {
  private readonly CURRENT_USER_TYPE = "#current_user_type-button";
  private readonly USER_TYPE_CHOICES =
    "a[href*='user_type'], a[href*='home.turnitin']";
  // Chrome variant uses #lang_submit-button; standard uses #lang_menu_link-button
  private readonly CURRENT_LANGUAGE_CHROME = "#lang_submit-button";
  private readonly CURRENT_LANGUAGE_INBOX = "#lang_menu_link-button";
  private readonly LANGUAGE_CHOICES_STANDARD = "form#lang_form li a";
  private readonly LANGUAGE_CHOICES_INBOX = "#lang_menu li a";
  private readonly LOGOUT = "a[href*='logout']";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  private async getLanguageButton(): Promise<string> {
    if (await this.elementExists(this.CURRENT_LANGUAGE_CHROME, 2000)) {
      return this.CURRENT_LANGUAGE_CHROME;
    }
    return this.CURRENT_LANGUAGE_INBOX;
  }

  async switchUserType(userType: string): Promise<void> {
    const currentText = await this.getText(this.CURRENT_USER_TYPE);
    if (currentText.includes(userType)) return;

    await this.click(this.CURRENT_USER_TYPE);
    await this.page
      .locator(this.USER_TYPE_CHOICES)
      .first()
      .waitFor({ state: "visible" });

    const choices = this.page.locator(this.USER_TYPE_CHOICES);
    const count = await choices.count();
    for (let i = 0; i < count; i++) {
      const text = await choices.nth(i).textContent();
      if (text && text.includes(userType)) {
        await choices.nth(i).click();
        return;
      }
    }
    throw new Error(`User type "${userType}" not found in dropdown`);
  }

  async switchToInstructorUserType(): Promise<void> {
    await this.switchUserType("Instructor");
  }

  async switchToStudentUserType(): Promise<void> {
    await this.switchUserType("Student");
  }

  async switchToAdministratorUserType(): Promise<void> {
    await this.switchUserType("Administrator");
  }

  async switchLanguageType(language: string): Promise<void> {
    const langBtn = await this.getLanguageButton();
    const currentLang = await this.getText(langBtn);
    if (currentLang.includes(language)) return;

    await this.click(langBtn);
    // Try both sets of language choices
    const choicesSelector =
      langBtn === this.CURRENT_LANGUAGE_CHROME
        ? this.LANGUAGE_CHOICES_STANDARD
        : this.LANGUAGE_CHOICES_INBOX;
    const choices = this.page.locator(choicesSelector);
    const count = await choices.count();
    for (let i = 0; i < count; i++) {
      const text = await choices.nth(i).textContent();
      if (text && text.includes(language)) {
        await choices.nth(i).click();
        return;
      }
    }
  }

  async logout(): Promise<void> {
    const logoutExists = await this.elementExists(this.LOGOUT, 10_000);
    if (logoutExists) {
      await this.page.locator(this.LOGOUT).click({ timeout: 30_000 });
    }
  }
}
