import { Page, Locator, FrameLocator } from "@playwright/test";
import { EnvironmentConfig } from "../config/environment.js";

/**
 * Base page object providing shared helpers that mirror the Python
 * `Common` / `BasePageObject` layer from webdriver_framework.
 *
 * Playwright auto-pierces shadow DOM and auto-waits on actions,
 * so most Selenium boilerplate (explicit waits, shadow traversal)
 * is unnecessary here.
 */
export class BasePage {
  constructor(
    protected page: Page,
    protected config: EnvironmentConfig
  ) {}

  /** Navigate to a URL. */
  async goToUrl(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  /** Refresh the current page. */
  async refresh(): Promise<void> {
    await this.page.reload({ waitUntil: "domcontentloaded" });
  }

  /** Get the current page URL. */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Locate an element using a CSS selector. Playwright auto-pierces shadow
   * DOM, so selectors like `tii-router tii-grade-submission input` work
   * across shadow boundaries without manual traversal.
   */
  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /** Get a frame locator for an iframe matched by `selector`. */
  frameLocator(selector: string): FrameLocator {
    return this.page.frameLocator(selector);
  }

  /** Click an element. */
  async click(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  /** Type text into an element, clearing it first. */
  async clearAndType(selector: string | Locator, text: string): Promise<void> {
    const loc = typeof selector === "string" ? this.page.locator(selector) : selector;
    await loc.click();
    await loc.fill(text);
  }

  /** Get the text content of an element. */
  async getText(selector: string | Locator): Promise<string> {
    const loc = typeof selector === "string" ? this.page.locator(selector) : selector;
    return (await loc.textContent()) ?? "";
  }

  /** Wait for an element to be visible. */
  async waitForVisible(selector: string, timeout?: number): Promise<void> {
    await this.page.locator(selector).waitFor({
      state: "visible",
      timeout: timeout ?? this.config.implicitWaitTime,
    });
  }

  /** Check if element exists on page. */
  async elementExists(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: "attached", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Accept a browser dialog if one appears. */
  async acceptAlertIfPresent(): Promise<void> {
    this.page.once("dialog", (dialog) => dialog.accept());
  }

  /** Close the current page/tab and switch to the first remaining one. */
  async closeWindowAndSwitchToFirst(): Promise<Page> {
    const pages = this.page.context().pages();
    await this.page.close();
    const target = pages.find((p) => p !== this.page) ?? pages[0];
    await target.bringToFront();
    return target;
  }

  /**
   * Shadow-aware locator for Playwright. Because Playwright auto-pierces
   * shadow DOM, this simply chains CSS selectors. Provided for readability
   * and 1-to-1 mapping with the Python `shadow_find` calls.
   */
  shadowFind(selector: string, root?: Locator): Locator {
    if (root) return root.locator(selector);
    return this.page.locator(selector);
  }

  /** Get the absolute path for a document file. */
  documentPath(relativePath: string): string {
    const p = require("path") as typeof import("path");
    return p.resolve(this.config.uploadDir, relativePath);
  }
}
