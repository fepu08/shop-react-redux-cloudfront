export class MissingEnvironmentVariablesError extends Error {
  constructor(msg?: string) {
    super(msg || "Environment variable(s) are missing");
    this.name = "MissingEnvironmentVariablesError";
  }
}
