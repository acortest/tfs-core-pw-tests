import { APIRequestContext } from "@playwright/test";
import { SdkWrapperConfig, PandaApiConfig } from "../config/environment.js";

/**
 * The SDK wrapper REST API (generic_env.php) uses URL query parameters
 * (not JSON body) for POST requests, matching the Python `requests.post(url, params=...)`.
 */
export class TurnitinApi {
  constructor(private request: APIRequestContext) {}

  private async findUserByEmail(
    email: string,
    restApi: SdkWrapperConfig
  ): Promise<string> {
    const response = await this.request.get(
      `${restApi.url}finduser/${email}`,
      { headers: restApi.headers }
    );
    if (!response.ok()) {
      throw new Error(
        `findUserByEmail failed: ${response.status()} ${await response.text()}`
      );
    }
    const body = await response.json();
    return String(body.userId);
  }

  async createClass(opts: {
    title: string;
    endDate: string;
    instructorEmail: string;
    restApi: SdkWrapperConfig;
  }): Promise<string> {
    const isoDate = parseDateToIso(opts.endDate);
    const params = new URLSearchParams({
      title: opts.title,
      endDate: isoDate,
    });
    const response = await this.request.post(
      `${opts.restApi.url}class/?${params.toString()}`,
      { headers: opts.restApi.headers }
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to create class: ${response.status()} ${await response.text()}`
      );
    }
    const text = await response.text();
    console.log(`API createClass raw response: ${text}`);
    const body = JSON.parse(text);
    if (body.error) {
      throw new Error(`API createClass error: ${body.error}`);
    }
    const classId = String(body.classId);
    console.log(`API createClass classId: ${classId}`);

    // The Python API also adds the instructor to the class after creation
    await this.addUserToClass(classId, opts.instructorEmail, "Instructor", opts.restApi);
    return classId;
  }

  async addUserToClass(
    classId: string,
    userEmail: string,
    role: string,
    restApi: SdkWrapperConfig
  ): Promise<void> {
    const userId = await this.findUserByEmail(userEmail, restApi);
    const params = new URLSearchParams({
      classId,
      userId,
      role,
    });
    const response = await this.request.post(
      `${restApi.url}membership/?${params.toString()}`,
      { headers: restApi.headers }
    );
    if (!response.ok()) {
      const text = await response.text();
      console.warn(`addUserToClass response: ${response.status()} ${text}`);
    }
  }

  async destroyExistingClass(
    title: string,
    classId: string,
    restApi: SdkWrapperConfig
  ): Promise<void> {
    try {
      const response = await this.request.delete(
        `${restApi.url}class/${classId}`,
        { headers: restApi.headers }
      );
      if (!response.ok()) {
        console.warn(
          `destroyExistingClass response: ${response.status()} ${await response.text()}`
        );
      }
    } catch (e) {
      console.warn(`Failed to destroy class ${classId}: ${e}`);
    }
  }

  async destroySubmissionPandaApi(
    submissionId: string,
    pandaApi: PandaApiConfig
  ): Promise<void> {
    try {
      const response = await this.request.delete(
        `${pandaApi.url}${submissionId}/purge`,
        { headers: pandaApi.headers }
      );
      if (!response.ok()) {
        console.warn(
          `destroySubmission response: ${response.status()} ${await response.text()}`
        );
      }
    } catch (e) {
      console.warn(`Failed to destroy submission ${submissionId}: ${e}`);
    }
  }

  async getClassicSubmissionPandaData(
    paperId: string,
    pandaApi: PandaApiConfig
  ): Promise<string> {
    const response = await this.request.get(
      `${pandaApi.url}${paperId}`,
      { headers: pandaApi.headers }
    );
    const body = await response.json();
    return String(body.submission_id ?? body.id ?? body);
  }
}

/**
 * Convert MM/DD/YYYY to ISO 8601 with UTC timezone.
 * Python's `parse_date_to_isoformat` uses `dateutil.parser.parse(date).replace(tzinfo=utc).isoformat()`
 * which produces `YYYY-MM-DDT00:00:00+00:00`.
 */
function parseDateToIso(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+00:00`;
  }
  return dateStr;
}

export function getDateNextYear(): string {
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const month = String(nextYear.getMonth() + 1).padStart(2, "0");
  const day = String(nextYear.getDate()).padStart(2, "0");
  return `${month}/${day}/${nextYear.getFullYear()}`;
}
