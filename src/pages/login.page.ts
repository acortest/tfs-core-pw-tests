import { Page } from "@playwright/test";
import { BasePage } from "./base-page.js";
import { EnvironmentConfig } from "../config/environment.js";

export class LoginPage extends BasePage {
  private readonly USERNAME = "#email";
  private readonly PASSWORD = "#password";
  private readonly LOGIN_BUTTON = ".submit[value='Log in']";
  private readonly PAGE_CONFIRM = "div.saFormHeaderProd";
  private readonly PAGE_CONFIRM_TEXT = "Log in to Turnitin";
  private readonly LOGIN_TEXT_IN_URL = "login_page";

  constructor(page: Page, config: EnvironmentConfig) {
    super(page, config);
  }

  async confirmOnLoginPage(): Promise<void> {
    await this.waitForVisible(this.PAGE_CONFIRM);
    const text = await this.getText(this.PAGE_CONFIRM);
    if (!text.includes(this.PAGE_CONFIRM_TEXT)) {
      throw new Error(`Not on login page. Found text: "${text}"`);
    }
  }

  async login(
    username?: string,
    password?: string,
    url?: string
  ): Promise<void> {
    const user = username ?? this.config.instructorUsername;
    const pass = password ?? this.config.instructorPassword;

    if (url) {
      await this.goToUrl(url);
    }

    await this.page.locator(this.USERNAME).waitFor({ state: "visible" });
    await this.page.locator(this.PASSWORD).waitFor({ state: "visible" });

    await this.clearAndType(this.USERNAME, user.trim());
    await this.clearAndType(this.PASSWORD, pass.trim());
    await this.click(this.LOGIN_BUTTON);

    await this.page.waitForURL((url) => !url.href.includes(this.LOGIN_TEXT_IN_URL), {
      timeout: 60_000,
    });
  }
}
