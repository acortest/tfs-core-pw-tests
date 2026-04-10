import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function envOrThrow(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function envOrDefault(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export interface SdkWrapperConfig {
  url: string;
  headers: Record<string, string>;
}

export interface PandaApiConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface EnvironmentConfig {
  tiiUrl: string;
  tiiLoginUrl: string;

  instructorUsername: string;
  instructorPassword: string;
  instructorFirstname: string;
  instructorLastname: string;

  studentUsername: string;
  studentPassword: string;
  studentFirstname: string;
  studentLastname: string;

  sdkWrapperRestApi: SdkWrapperConfig;
  sdkWrapperRestApiTfsplus: SdkWrapperConfig;

  pandaSubmissionPurgeApi: PandaApiConfig;
  pandaSubmissionSearchApi: PandaApiConfig;

  uploadDir: string;
  language: string;
  implicitWaitTime: number;
  submissionTimeout: number;
}

export function loadConfig(): EnvironmentConfig {
  const sdkUrl = envOrDefault(
    "SDK_WRAPPER_URL",
    "https://jenkins.turnitin.com/qa/sdkrest/generic_env.php/"
  );
  const tiiUrl = envOrThrow("TII_URL");
  const accountId = envOrDefault("SDK_WRAPPER_ACCOUNT_ID", "82014");
  const tfsPlusAccountId = envOrDefault(
    "SDK_WRAPPER_TFSPLUS_ACCOUNT_ID",
    "82680"
  );

  return {
    tiiUrl,
    tiiLoginUrl: envOrThrow("TII_LOGIN_URL"),

    instructorUsername: envOrDefault(
      "INSTRUCTOR_USERNAME",
      "qmm+tfs.instructor.all@turnitin.com"
    ),
    instructorPassword: envOrDefault("INSTRUCTOR_PASSWORD", "Test1ng4life*"),
    instructorFirstname: envOrDefault("INSTRUCTOR_FIRSTNAME", "Instructor All"),
    instructorLastname: envOrDefault("INSTRUCTOR_LASTNAME", "TFS Automation"),

    studentUsername: envOrDefault(
      "STUDENT_USERNAME",
      "qmm+tfs.student.01@turnitin.com"
    ),
    studentPassword: envOrDefault("STUDENT_PASSWORD", "test1ng4life"),
    studentFirstname: envOrDefault("STUDENT_FIRSTNAME", "Student 01"),
    studentLastname: envOrDefault("STUDENT_LASTNAME", "TFS Automation"),

    sdkWrapperRestApi: {
      url: sdkUrl,
      headers: {
        "Content-Length": "0",
        "X-API-URL": tiiUrl.replace(/\/$/, "").replace("http://", "https://"),
        "X-ACCOUNT-ID": accountId,
      },
    },

    sdkWrapperRestApiTfsplus: {
      url: sdkUrl,
      headers: {
        "Content-Length": "0",
        "X-API-URL": tiiUrl.replace(/\/$/, "").replace("http://", "https://"),
        "X-ACCOUNT-ID": tfsPlusAccountId,
      },
    },

    pandaSubmissionPurgeApi: {
      url: envOrDefault(
        "PANDA_SUBMISSION_PURGE_URL",
        "https://internal-qa.us2.turnitin.org/sms-namespace/seu/sms-serviceName/panda/submission/"
      ),
    },

    pandaSubmissionSearchApi: {
      url: envOrDefault(
        "PANDA_SUBMISSION_SEARCH_URL",
        "https://qa1-www.turnitin.com/internalapi/objectinfo/v1/object/"
      ),
      headers: {
        "Content-Type": "application/json",
        "X-INSTITUTION-ID": envOrDefault("PANDA_INSTITUTION_ID", "58681"),
      },
    },

    uploadDir: envOrDefault("UPLOAD_DIR", "./src/documents/"),
    language: "English",
    implicitWaitTime: 30_000,
    submissionTimeout: 120_000,
  };
}
