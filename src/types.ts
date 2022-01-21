
export enum LoginMethod {
  Basic,
  Google,
}

export type LoginInfo = {
  email: string,
  name?: string | null,
  loginMethod: LoginMethod
}